/*
  Warnings:

  - You are about to drop the column `serviceCategory` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "serviceCategory",
ADD COLUMN     "serviceCategories" "public"."ServiceCategory"[];
