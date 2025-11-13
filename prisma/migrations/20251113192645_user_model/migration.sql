/*
  Warnings:

  - The values [USER,ADMIN,CONTIBUTOR] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isContibute` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."ServiceCategory" AS ENUM ('MECHANICAL_REPAIR', 'AC_HEATING', 'ELECTRICAL_SYSTEMS', 'BODY_AND_PAINT', 'DIAGNOSTICS', 'GENERAL_MAINTENANCE');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."UserRole_new" AS ENUM ('CAR_OWNER', 'GARAGE_OWNER', 'SUPER_ADMIN', 'MEMBER');
ALTER TABLE "public"."users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "role" TYPE "public"."UserRole_new" USING ("role"::text::"public"."UserRole_new");
ALTER TYPE "public"."UserRole" RENAME TO "UserRole_old";
ALTER TYPE "public"."UserRole_new" RENAME TO "UserRole";
DROP TYPE "public"."UserRole_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "isContibute",
ADD COLUMN     "garageLogo" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "serviceCategory" "public"."ServiceCategory",
ADD COLUMN     "tradeLicense" TEXT,
ALTER COLUMN "role" DROP DEFAULT;

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "public"."users"("phone");
