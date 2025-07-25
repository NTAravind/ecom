-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_brandId_fkey";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "delivered" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "yarnAccessoryId" TEXT,
ALTER COLUMN "productId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "YarnAccessory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "originalPrice" INTEGER NOT NULL,
    "discountedPrice" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "imageUrl" TEXT NOT NULL,
    "imageUrl1" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "stock" INTEGER NOT NULL,
    "dimensions" TEXT,
    "material" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "YarnAccessory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "YarnAccessory" ADD CONSTRAINT "YarnAccessory_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_yarnAccessoryId_fkey" FOREIGN KEY ("yarnAccessoryId") REFERENCES "YarnAccessory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
