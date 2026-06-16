/**
 * Olivia Product Upload & Seed Script
 * ------------------------------------
 * 1. Reads all OLV*.webp images from /olivia/
 * 2. Uploads each to GitHub (NTAravind/Yarn-images) via the Contents API
 * 3. Inserts products into the database via Prisma (skipDuplicates — no deletions)
 *
 * Run: node --env-file=.env prisma/uploadAndSeedOlivia.js
 */

import { PrismaClient } from "../app/generated/prisma/client.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config (read from env) ───────────────────────────────────────────────────
const GITHUB_TOKEN  = process.env.GITHUB_TOKEN;
const GITHUB_OWNER  = process.env.GITHUB_OWNER;
const GITHUB_REPO   = process.env.GITHUB_REPO;
const GITHUB_BRANCH = "main";
const GITHUB_PATH   = "images"; // folder inside the repo

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.error("❌  Missing GITHUB_TOKEN, GITHUB_OWNER, or GITHUB_REPO in environment.");
  process.exit(1);
}

// ── Product defaults ─────────────────────────────────────────────────────────
const BRAND_ID         = "f7992138-aab5-4000-8f8c-323b27956334";
const ORIGINAL_PRICE   = 130;
const DISCOUNTED_PRICE = 117;   // 10% off
const STOCK            = 0;
const Y_WEIGHT         = "light-dk";
const WEIGHT_G         = 100;
const CATEGORY         = "acrylic";
const IS_YARN          = true;
const SHOWN            = true;
const COLOR_PLACEHOLDER = "#808080";

const DESCRIPTION =
  "Olivia Yarn is a premium light DK-weight acrylic yarn designed for crochet and knitting enthusiasts. " +
  "With its silky smooth finish, excellent stitch definition, and vibrant color range, Olivia is perfect for " +
  "garments, amigurumi, home décor, and accessories. Available in a wide palette of shades, each skein delivers " +
  "consistent quality and long-lasting color brilliance—ideal for both beginners and experienced makers.";

// ── Paths ────────────────────────────────────────────────────────────────────
const OLIVIA_DIR = path.join(__dirname, "..", "olivia");

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Upload a single file to GitHub. Returns the jsDelivr CDN URL.
 * If the file already exists on GitHub it will be updated (not duplicated).
 * Retries up to MAX_RETRIES times on transient network errors.
 */
const MAX_RETRIES = 4;

async function uploadToGitHub(filename, fileBuffer) {
  const encodedContent = fileBuffer.toString("base64");
  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${GITHUB_PATH}/${filename}`;
  const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "olivia-seed-script",
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Check if file already exists so we can get its SHA for an update
      let sha;
      const checkResp = await fetch(apiUrl, { headers });
      if (checkResp.ok) {
        const existing = await checkResp.json();
        sha = existing.sha;
        console.log(`    ⚠️  Already on GitHub — will update: ${filename}`);
      }

      const body = {
        message: `Upload Olivia product image: ${filename}`,
        content: encodedContent,
        branch: GITHUB_BRANCH,
        ...(sha ? { sha } : {}),
      };

      const putResp = await fetch(apiUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(body),
      });

      if (!putResp.ok) {
        const errText = await putResp.text();
        throw new Error(`GitHub API ${putResp.status}: ${errText}`);
      }

      return `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@${GITHUB_BRANCH}/${GITHUB_PATH}/${filename}`;
    } catch (err) {
      if (attempt === MAX_RETRIES) throw err;
      const delay = 2000 * attempt; // 2s, 4s, 6s backoff
      console.log(`    ⟳  Attempt ${attempt} failed (${err.message}). Retrying in ${delay / 1000}s...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

/** "OLV001.webp" → "Olivia OLV001" */
function toProductName(filename) {
  const code = path.basename(filename, ".webp").toUpperCase();
  return `Olivia ${code}`;
}

// ── Main ─────────────────────────────────────────────────────────────────────
const prisma = new PrismaClient();

async function main() {
  // 1. Collect image files
  const files = (await fs.readdir(OLIVIA_DIR))
    .filter((f) => f.toLowerCase().endsWith(".webp"))
    .sort();

  console.log(`\n📁  Found ${files.length} images in /olivia/\n`);

  const products = [];

  // 2. Upload each image
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const filePath = path.join(OLIVIA_DIR, filename);
    process.stdout.write(`[${String(i + 1).padStart(2, "0")}/${files.length}] Uploading ${filename} ... `);

    const fileBuffer = await fs.readFile(filePath);
    const cdnUrl = await uploadToGitHub(filename, fileBuffer);
    console.log(`✅`);
    console.log(`    CDN → ${cdnUrl}`);

    products.push({
      pname:          toProductName(filename),
      brandId:        BRAND_ID,
      originalPrice:  ORIGINAL_PRICE,
      discountedPrice: DISCOUNTED_PRICE,
      Shown:          SHOWN,
      irul:           cdnUrl,
      desc:           DESCRIPTION,
      y_weight:       Y_WEIGHT,
      weight_g:       WEIGHT_G,
      category:       CATEGORY,
      stock:          STOCK,
      color:          COLOR_PLACEHOLDER,
      isYarn:         IS_YARN,
    });

    // 300 ms pause — avoids GitHub secondary-rate-limit
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n🌱  Seeding ${products.length} Olivia products into the database...`);

  // 3. Insert — skipDuplicates means no existing records are touched / deleted
  const result = await prisma.product.createMany({
    data: products,
    skipDuplicates: true,
  });

  console.log(`\n✅  Done! Inserted ${result.count} product(s).`);
  if (result.count < products.length) {
    console.log(`   (${products.length - result.count} skipped as duplicates)`);
  }

  // 4. Save generated data for reference
  const outputPath = path.join(__dirname, "data", "olivia_products_generated.json");
  await fs.writeFile(outputPath, JSON.stringify(products, null, 2), "utf8");
  console.log(`\n📄  Reference JSON saved → ${outputPath}`);
}

main()
  .catch((e) => {
    console.error("\n❌  Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
