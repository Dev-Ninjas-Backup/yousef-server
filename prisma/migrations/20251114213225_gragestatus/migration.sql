-- CreateEnum
CREATE TYPE "public"."GarageStatus" AS ENUM ('APPROVE', 'PENDING', 'DECLINE');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "garageStatus" "public"."GarageStatus" NOT NULL DEFAULT 'PENDING';
