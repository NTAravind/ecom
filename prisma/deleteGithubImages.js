/**
 * Delete GitHub Images for a Brand
 * ----------------------------------
 * 1. Fetches all products for the given brandId from the DB
 * 2. Extracts the image path from each product's `irul` field
 * 3. Deletes each image from GitHub using the Contents API
 *
 * IMPORTANT: Only deletes images from GitHub — does NOT touch the DB records.
 *
 * Run: node --env-file=.env prisma/deleteGithubImages.js
 */

import { PrismaClient } from "../app/generated/prisma/client.js";

// ── Config ────────────────────────────────────────────────────────────────────
const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_OWNER  = process.env.GITHUB_OWNER;
const GITHUB_REPO   = process.env.GITHUB_REPO;
const GITHUB_BRANCH = "main";

const BRAND_ID = "cb7b03f0-1003-4d6f-abd0-8a41a198c473";

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error("❌  Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO in environment.");
  process.exit(1);
}

const BASE_HEADERS = {
  Authorization: `token ${GITHUB_TOKEN}`,
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "delete-brand-images-script",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts the path inside the GitHub repo from an irul value.
 *
 * Handles two common URL patterns:
 *   - jsDelivr:  https://cdn.jsdelivr.net/gh/OWNER/REPO@BRANCH/images/foo.webp
 *   - raw GitHub: https://raw.githubusercontent.com/OWNER/REPO/BRANCH/images/foo.webp
 *
 * Returns the file path inside the repo (e.g. "images/foo.webp") or null
 * if the URL can't be parsed.
 */
function extractRepoPath(irul) {
  if (!irul) return null;

  // jsDelivr pattern
  const jsDelivrMatch = irul.match(
    /cdn\.jsdelivr\.net\/gh\/[^/]+\/[^/@]+@[^/]+\/(.+)/
  );
  if (jsDelivrMatch) return jsDelivrMatch[1];

  // raw.githubusercontent.com pattern
  const rawMatch = irul.match(
    /raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)/
  );
  if (rawMatch) return rawMatch[1];

  // Fallback: treat everything after the repo@branch segment as the path
  // by just taking the filename and assuming it lives in "images/"
  const filename = irul.split("/").pop();
  if (filename) {
    console.warn(`    ⚠️  Could not parse repo path from URL — assuming images/${filename}`);
    return `images/${filename}`;
  }

  return null;
}

/**
 * Gets the current SHA for a file in the repo.
 * Returns null if the file doesn't exist.
 */
async function getFileSha(repoPath) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}?ref=${GITHUB_BRANCH}`;
  const resp = await fetch(url, { headers: BASE_HEADERS });

  if (resp.status === 404) return null;

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API ${resp.status} fetching SHA for ${repoPath}: ${text}`);
  }

  const data = await resp.json();
  return data.sha ?? null;
}

/**
 * Deletes a file from the GitHub repo.
 * Returns true on success, false if the file was not found.
 */
async function deleteFromGitHub(repoPath, sha) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${repoPath}`;
  const resp = await fetch(url, {
    method: "DELETE",
    headers: BASE_HEADERS,
    body: JSON.stringify({
      message: `Delete image: ${repoPath} (brand ${BRAND_ID})`,
      sha,
      branch: GITHUB_BRANCH,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`GitHub API ${resp.status} deleting ${repoPath}: ${text}`);
  }

  return true;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const prisma = new PrismaClient();

async function main() {
  console.log(`\n🔍  Fetching products for brand: ${BRAND_ID} ...`);

  const products = await prisma.product.findMany({
    where: { brandId: BRAND_ID },
    select: { id: true, pname: true, irul: true },
  });

  if (products.length === 0) {
    console.log("⚠️  No products found for this brand. Exiting.");
    return;
  }

  console.log(`📦  Found ${products.length} products.\n`);

  let deleted = 0;
  let skipped = 0;
  let failed  = 0;

  for (let i = 0; i < products.length; i++) {
    const { pname, irul } = products[i];
    const label = `[${String(i + 1).padStart(3, "0")}/${products.length}]`;

    if (!irul) {
      console.log(`${label} ⚠️  ${pname} — no irul, skipping.`);
      skipped++;
      continue;
    }

    const repoPath = extractRepoPath(irul);
    if (!repoPath) {
      console.log(`${label} ⚠️  ${pname} — cannot parse path from irul: ${irul}`);
      skipped++;
      continue;
    }

    process.stdout.write(`${label} 🗑️  ${pname} (${repoPath}) ... `);

    try {
      const sha = await getFileSha(repoPath);

      if (!sha) {
        console.log(`NOT FOUND on GitHub — skipping.`);
        skipped++;
        continue;
      }

      await deleteFromGitHub(repoPath, sha);
      console.log(`✅  Deleted.`);
      deleted++;
    } catch (err) {
      console.log(`❌  FAILED: ${err.message}`);
      failed++;
    }

    // Small pause to stay within GitHub's secondary rate limits
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Deleted : ${deleted}
⚠️  Skipped : ${skipped}
❌  Failed  : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main()
  .catch((e) => {
    console.error("\n❌  Fatal error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
