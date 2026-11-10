-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "is_production_item" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "is_production_item" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "products_is_production_item_idx" ON "products"("is_production_item");
