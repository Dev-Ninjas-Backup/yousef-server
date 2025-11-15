/*
  Warnings:

  - You are about to drop the column `createdById` on the `Service` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Service" DROP CONSTRAINT "Service_createdById_fkey";

-- AlterTable
ALTER TABLE "public"."Service" DROP COLUMN "createdById";
