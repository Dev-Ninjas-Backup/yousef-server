/*
  Warnings:

  - You are about to alter the column `promoCost` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(65,30)`.

*/
-- AlterTable
ALTER TABLE "public"."Product" ALTER COLUMN "status" SET DEFAULT 'Pending Approval',
ALTER COLUMN "promoCost" SET DATA TYPE DECIMAL(65,30);
