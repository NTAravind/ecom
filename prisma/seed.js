import { PrismaClient } from "../app/generated/prisma/client.js";



const prisma = new PrismaClient();

async function main() {
await prisma.product.updateMany({
  where: {brandId:'cb7b03f0-1003-4d6f-abd0-8a41a198c473'},
  data: { weight_g:130 },
});

  console.log('Products seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });