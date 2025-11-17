/*
  Warnings:

  - The `imageUrl` column on the `Promotion` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."Promotion" DROP COLUMN "imageUrl",
ADD COLUMN     "imageUrl" TEXT[] DEFAULT ARRAY[]::TEXT[];
