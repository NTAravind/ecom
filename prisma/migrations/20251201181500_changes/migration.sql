/*
  Warnings:

  - You are about to drop the column `iurl1` on the `Product` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Order_paymentid_key";

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "defaultImageUrl" TEXT NOT NULL DEFAULT 'https://example.com/default-brand-img.jpg';

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "iurl1";
