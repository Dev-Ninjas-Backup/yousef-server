/*
  Warnings:

  - You are about to drop the `BrandExpertise` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `GarageBrand` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."GarageBrand" DROP CONSTRAINT "GarageBrand_brandId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GarageBrand" DROP CONSTRAINT "GarageBrand_garageId_fkey";

-- AlterTable
ALTER TABLE "public"."Garage" ADD COLUMN     "brandExpertise" TEXT[];

-- DropTable
DROP TABLE "public"."BrandExpertise";

-- DropTable
DROP TABLE "public"."GarageBrand";
