/*
  Warnings:

  - The `certifications` column on the `Garage` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Garage" DROP COLUMN "certifications",
ADD COLUMN     "certifications" TEXT[];
