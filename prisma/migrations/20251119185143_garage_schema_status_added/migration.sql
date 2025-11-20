-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "public"."Garage" ADD COLUMN     "status" "public"."Status" NOT NULL DEFAULT 'PENDING';
