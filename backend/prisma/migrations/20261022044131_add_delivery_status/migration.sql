-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('NOT_SHIPPED', 'SHIPPED');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivery_status" "DeliveryStatus" NOT NULL DEFAULT 'NOT_SHIPPED',
ADD COLUMN     "shipped_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "orders_delivery_status_idx" ON "orders"("delivery_status");
