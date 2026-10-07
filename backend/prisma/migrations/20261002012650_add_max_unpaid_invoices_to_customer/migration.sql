/*
  Warnings:

  - You are about to drop the column `numInvoices` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "numInvoices",
ADD COLUMN     "max_unpaid_invoices" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "num_invoices" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");
