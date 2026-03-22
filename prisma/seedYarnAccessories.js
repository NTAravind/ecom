import { PrismaClient } from "../app/generated/prisma/client.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const dataPath = path.join(__dirname, "..", "yarn_accessories.json");
  console.log("Reading data file from", dataPath);
  
  const accessoriesData = await fs.readFile(dataPath, "utf8");
  const accessories = JSON.parse(accessoriesData);
  
  console.log(`Found ${accessories.length} yarn accessories to seed.`);
  
  console.log("Seeding Yarn Accessories...");
  if (accessories.length > 0) {
    await prisma.yarnAccessory.createMany({ 
      data: accessories 
    });
  }

  console.log("Yarn accessories seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
