-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('OPERATIONAL', 'MATERIAL');

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "cost_price" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "cost_price" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "expense_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expense_type" "ExpenseType" NOT NULL DEFAULT 'OPERATIONAL',
    "category" TEXT NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "expenses_expense_date_idx" ON "expenses"("expense_date");

-- CreateIndex
CREATE INDEX "expenses_expense_type_idx" ON "expenses"("expense_type");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");
