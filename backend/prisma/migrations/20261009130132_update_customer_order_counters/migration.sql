/*
  Warnings:

  - You are about to drop the column `max_unpaid_orders` on the `customers` table. All the data in the column will be lost.
  - You are about to drop the column `num_orders` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "max_unpaid_orders",
DROP COLUMN "num_orders",
ADD COLUMN     "total_orders" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unpaid_orders_count" INTEGER NOT NULL DEFAULT 0;
