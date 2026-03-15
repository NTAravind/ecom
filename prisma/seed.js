import { PrismaClient } from "../app/generated/prisma/client.js";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const dataDir = path.join(__dirname, "data");

  console.log("Cleaning up existing data...");
  // Delete in order to respect foreign key constraints
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.user.deleteMany();
  await prisma.product.deleteMany();
  await prisma.yarnAccessory.deleteMany();
  await prisma.brand.deleteMany();

  console.log("Reading data files...");
  const brands = JSON.parse(await fs.readFile(path.join(dataDir, "brands.json"), "utf8"));
  const products = JSON.parse(await fs.readFile(path.join(dataDir, "products.json"), "utf8"));
  const users = JSON.parse(await fs.readFile(path.join(dataDir, "users.json"), "utf8"));
  const orders = JSON.parse(await fs.readFile(path.join(dataDir, "orders.json"), "utf8"));
  const orderItems = JSON.parse(await fs.readFile(path.join(dataDir, "orderItems.json"), "utf8"));
  const accessories = JSON.parse(await fs.readFile(path.join(dataDir, "accessories.json"), "utf8"));

  console.log("Seeding Brands...");
  await prisma.brand.createMany({ data: brands });

  console.log("Seeding Users...");
  await prisma.user.createMany({ data: users });

  console.log("Seeding Products...");
  await prisma.product.createMany({ data: products });

  console.log("Seeding Accessories...");
  if (accessories.length > 0) {
    await prisma.yarnAccessory.createMany({ data: accessories });
  }

  console.log("Seeding Orders...");
  await prisma.order.createMany({ 
    data: orders.map(o => ({
      ...o,
      createdAt: new Date(o.createdAt)
    }))
  });

  console.log("Seeding Order Items...");
  await prisma.orderItem.createMany({ data: orderItems });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });