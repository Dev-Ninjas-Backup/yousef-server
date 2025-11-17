/*
  Warnings:

  - The values [REJECT] on the enum `PromotionAdStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."PromotionAdStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');
ALTER TABLE "public"."Promotion" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Promotion" ALTER COLUMN "status" TYPE "public"."PromotionAdStatus_new" USING ("status"::text::"public"."PromotionAdStatus_new");
ALTER TYPE "public"."PromotionAdStatus" RENAME TO "PromotionAdStatus_old";
ALTER TYPE "public"."PromotionAdStatus_new" RENAME TO "PromotionAdStatus";
DROP TYPE "public"."PromotionAdStatus_old";
ALTER TABLE "public"."Promotion" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Promotion" ADD COLUMN     "isFree" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentId" TEXT;

-- CreateTable
CREATE TABLE "public"."GaragePromotionQuota" (
    "id" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,
    "freeListingsTotal" INTEGER NOT NULL DEFAULT 2,
    "freeListingsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GaragePromotionQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GaragePromotionQuota_garageId_key" ON "public"."GaragePromotionQuota"("garageId");

-- AddForeignKey
ALTER TABLE "public"."GaragePromotionQuota" ADD CONSTRAINT "GaragePromotionQuota_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
