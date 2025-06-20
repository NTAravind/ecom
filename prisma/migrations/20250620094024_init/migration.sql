/*
  Warnings:

  - A unique constraint covering the columns `[paymentid]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paid" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentid_key" ON "Order"("paymentid");
