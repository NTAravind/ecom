/*
  Warnings:

  - You are about to drop the column `brandId` on the `YarnAccessory` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `YarnAccessory` table. All the data in the column will be lost.
  - You are about to drop the column `dimensions` on the `YarnAccessory` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl1` on the `YarnAccessory` table. All the data in the column will be lost.
  - You are about to drop the column `material` on the `YarnAccessory` table. All the data in the column will be lost.
  - You are about to drop the column `subcategory` on the `YarnAccessory` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "YarnAccessory" DROP CONSTRAINT "YarnAccessory_brandId_fkey";

-- AlterTable
ALTER TABLE "YarnAccessory" DROP COLUMN "brandId",
DROP COLUMN "color",
DROP COLUMN "dimensions",
DROP COLUMN "imageUrl1",
DROP COLUMN "material",
DROP COLUMN "subcategory";
