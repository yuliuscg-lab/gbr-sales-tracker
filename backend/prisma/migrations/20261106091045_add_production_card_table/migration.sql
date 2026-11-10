-- DropIndex
DROP INDEX "orders_delivery_status_idx";

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "production_card_id" TEXT;

-- CreateTable
CREATE TABLE "production_cards" (
    "id" TEXT NOT NULL,
    "card_no" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "production_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "production_cards_card_no_key" ON "production_cards"("card_no");

-- CreateIndex
CREATE INDEX "production_cards_created_at_idx" ON "production_cards"("created_at");

-- CreateIndex
CREATE INDEX "orders_delivery_status_production_card_id_idx" ON "orders"("delivery_status", "production_card_id");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_production_card_id_fkey" FOREIGN KEY ("production_card_id") REFERENCES "production_cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
