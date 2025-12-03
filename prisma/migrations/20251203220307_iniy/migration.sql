/*
  Warnings:

  - Made the column `address` on table `Garage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `garageLat` on table `Garage` required. This step will fail if there are existing NULL values in that column.
  - Made the column `garageLng` on table `Garage` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."Garage_name_key";

-- AlterTable
ALTER TABLE "public"."Garage" ADD COLUMN     "formattedAddress" TEXT,
ADD COLUMN     "placeId" TEXT,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "garageLat" SET NOT NULL,
ALTER COLUMN "garageLng" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Garage_garageLat_garageLng_idx" ON "public"."Garage"("garageLat", "garageLng");

-- CreateIndex
CREATE INDEX "Garage_placeId_idx" ON "public"."Garage"("placeId");

-- CreateIndex
CREATE INDEX "Garage_status_idx" ON "public"."Garage"("status");

-- CreateIndex
CREATE INDEX "Garage_userId_idx" ON "public"."Garage"("userId");
