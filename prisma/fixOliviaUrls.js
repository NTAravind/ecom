/**
 * Fix Olivia Product Image URLs
 * Replace cdn.jsdelivr.net URLs with raw.githubusercontent.com for all Olivia products.
 * This is needed because the Yarn-images repo exceeded jsDelivr's 50 MB package limit.
 *
 * Run: node --env-file=.env prisma/fixOliviaUrls.js
 */

import { PrismaClient } from "../app/generated/prisma/client.js";

const prisma = new PrismaClient();

const OLD_BASE = "https://cdn.jsdelivr.net/gh/NTAravind/Yarn-images@main/images/";
const NEW_BASE = "https://raw.githubusercontent.com/NTAravind/Yarn-images/main/images/";

async function main() {
  // Find all Olivia products with the old CDN URL
  const products = await prisma.product.findMany({
    where: {
      irul: { startsWith: OLD_BASE },
      brandId: "f7992138-aab5-4000-8f8c-323b27956334",
    },
    select: { id: true, pname: true, irul: true },
  });

  console.log(`\n🔍  Found ${products.length} Olivia products with old jsDelivr URLs.\n`);

  let updated = 0;
  for (const p of products) {
    const newUrl = p.irul.replace(OLD_BASE, NEW_BASE);
    await prisma.product.update({
      where: { id: p.id },
      data: { irul: newUrl },
    });
    console.log(`  ✅  ${p.pname}`);
    console.log(`       ${newUrl}`);
    updated++;
  }

  console.log(`\n✅  Done! Updated ${updated} product URLs.`);
}

main()
  .catch((e) => {
    console.error("\n❌  Error:", e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
