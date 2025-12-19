/*
  Warnings:

  - The `serviceCategories` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('MECHANICAL_REPAIR', 'AC_HEATING', 'ELECTRICAL_SYSTEMS', 'BODY_AND_PAINT', 'DIAGNOSTICS', 'GENERAL_MAINTENANCE');

-- AlterTable
ALTER TABLE "users" DROP COLUMN "serviceCategories",
ADD COLUMN     "serviceCategories" "ServiceCategory"[];
