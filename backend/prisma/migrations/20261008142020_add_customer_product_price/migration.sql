/*
  Warnings:

  - You are about to drop the column `basePrice` on the `products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" DROP COLUMN "basePrice";

-- CreateTable
CREATE TABLE "customer_product_prices" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "productUnitId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_product_prices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "customer_product_prices_customer_id_idx" ON "customer_product_prices"("customer_id");

-- CreateIndex
CREATE INDEX "customer_product_prices_productUnitId_idx" ON "customer_product_prices"("productUnitId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_product_prices_customer_id_productUnitId_key" ON "customer_product_prices"("customer_id", "productUnitId");

-- AddForeignKey
ALTER TABLE "customer_product_prices" ADD CONSTRAINT "customer_product_prices_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_product_prices" ADD CONSTRAINT "customer_product_prices_productUnitId_fkey" FOREIGN KEY ("productUnitId") REFERENCES "product_units"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
