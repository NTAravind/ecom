/**
 * Olivia CDN Fix — Split Repo
 * ----------------------------
 * 1. Creates a new GitHub repo: NTAravind/Yarn-images-olivia
 * 2. Re-uploads all 61 OLV*.webp images to it
 * 3. Updates product irul in DB to jsDelivr CDN URLs from the new repo
 *
 * Run: node --env-file=.env prisma/splitRepoOlivia.js
 * No deletions anywhere.
 */

import { PrismaClient } from "../app/generated/prisma/client.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
console.log("Script dir:", __dirname);

// ── Config ───────────────────────────────────────────────────────────────────
const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_OWNER  = process.env.GITHUB_OWNER;
const NEW_REPO      = "Yarn-images-olivia";
const GITHUB_BRANCH = "main";
const GITHUB_PATH   = "images";
const OLIVIA_DIR    = path.join(__dirname, "..", "olivia");
const BRAND_ID      = "f7992138-aab5-4000-8f8c-323b27956334";
const MAX_RETRIES   = 4;

if (!GITHUB_TOKEN || !GITHUB_OWNER) {
  console.error("❌  Missing GITHUB_TOKEN or GITHUB_OWNER in environment.");
  process.exit(1);
}

const BASE_HEADERS = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "olivia-split-repo-script",
};

// ── Step 1: Create the new repo ──────────────────────────────────────────────
async function createRepo() {
  console.log(`\n📦  Creating repo: ${GITHUB_OWNER}/${NEW_REPO} ...`);

  // Check if it already exists
  const checkResp = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${NEW_REPO}`,
    { headers: BASE_HEADERS }
  );
  if (checkResp.ok) {
    console.log(`    ⚠️  Repo already exists — skipping creation.`);
    return;
  }

  const resp = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: BASE_HEADERS,
    body: JSON.stringify({
      name: NEW_REPO,
      description: "Olivia yarn product images",
      private: false,
      auto_init: true, // creates an initial commit so the branch exists
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to create repo: ${resp.status} ${err}`);
  }

  console.log(`    ✅  Repo created.`);

  // Wait a moment for GitHub to initialise the repo
  console.log(`    ⏳  Waiting 3s for repo initialisation...`);
  await new Promise((r) => setTimeout(r, 3000));
}

// ── Step 2: Upload images ────────────────────────────────────────────────────
async function uploadToGitHub(filename, fileBuffer) {
  const encodedContent = fileBuffer.toString("base64");
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${NEW_REPO}/contents/${GITHUB_PATH}/${filename}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Check if file already exists (get SHA for update)
      let sha;
      const checkResp = await fetch(apiUrl, { headers: BASE_HEADERS });
      if (checkResp.ok) {
        sha = (await checkResp.json()).sha;
        console.log(`    ⚠️  Already exists — will update: ${filename}`);
      }

      const putResp = await fetch(apiUrl, {
        method: "PUT",
        headers: BASE_HEADERS,
        body: JSON.stringify({
          message: `Upload Olivia image: ${filename}`,
          content: encodedContent,
          branch: GITHUB_BRANCH,
          ...(sha ? { sha } : {}),
        }),
      });

      if (!putResp.ok) {
        const errText = await putResp.text();
        throw new Error(`GitHub API ${putResp.status}: ${errText}`);
      }

      return `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${NEW_REPO}@${GITHUB_BRANCH}/${GITHUB_PATH}/${filename}`;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delay = 2000 * attempt;
      console.log(`    ⟳  Attempt ${attempt} failed (${err.message}). Retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const prisma = new PrismaClient();

async function main() {
  // Step 1 — Create repo
  await createRepo();

  // Step 2 — Upload images
  const files = (await fs.readdir(OLIVIA_DIR))
    .filter((f) => f.toLowerCase().endsWith(".webp"))
    .sort();

  console.log(`\n📁  Found ${files.length} images in /olivia/\n`);

  const urlMap = {}; // filename → new CDN URL

  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${files.length}] Uploading ${filename} ... `);
    const fileBuffer = await fs.readFile(path.join(OLIVIA_DIR, filename));
    const cdnUrl = await uploadToGitHub(filename, fileBuffer);
    urlMap[filename] = cdnUrl;
    console.log(`✅`);
    console.log(`    CDN → ${cdnUrl}`);

    // 300ms pause to avoid GitHub rate limiting
    await new Promise((r) => setTimeout(r, 300));
  }

  // Step 3 — Update DB URLs
  console.log(`\n🔄  Updating database URLs for 61 Olivia products...`);

  const products = await prisma.product.findMany({
    where: { brandId: BRAND_ID },
    select: { id: true, pname: true, irul: true },
  });

  let updated = 0;
  for (const p of products) {
    // Derive filename from existing URL (last segment)
    const filename = p.irul.split("/").pop();
    const newUrl = urlMap[filename];

    if (!newUrl) {
      console.log(`  ⚠️  No URL mapping found for ${p.pname} (${filename}) — skipping`);
      continue;
    }

    await prisma.product.update({
      where: { id: p.id },
      data: { irul: newUrl },
    });
    console.log(`  ✅  ${p.pname} → ${newUrl}`);
    updated++;
  }

  console.log(`\n✅  All done! ${updated} product URLs updated to jsDelivr CDN.`);
  console.log(`   New repo: https://github.com/${GITHUB_OWNER}/${NEW_REPO}`);
}

main()
  .catch((e) => {
    console.error("\n❌  Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
