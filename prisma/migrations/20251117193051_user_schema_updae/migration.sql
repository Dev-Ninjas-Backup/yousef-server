/*
  Warnings:

  - You are about to drop the column `phone` on the `Garage` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `garageLat` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `garageLng` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Garage" DROP COLUMN "phone",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "garageLat" DOUBLE PRECISION,
ADD COLUMN     "garageLng" DOUBLE PRECISION,
ADD COLUMN     "garagePhone" TEXT;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "address",
DROP COLUMN "garageLat",
DROP COLUMN "garageLng";
