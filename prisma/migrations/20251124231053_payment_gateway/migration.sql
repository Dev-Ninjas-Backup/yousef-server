/*
  Warnings:

  - You are about to drop the column `planId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the `payment_plans` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_planId_fkey";

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "planId";

-- DropTable
DROP TABLE "payment_plans";
