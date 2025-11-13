/*
  Warnings:

  - You are about to drop the `WorkingHour` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."WorkingHour" DROP CONSTRAINT "WorkingHour_garageId_fkey";

-- AlterTable
ALTER TABLE "public"."Garage" ADD COLUMN     "weekdaysHours" TEXT,
ADD COLUMN     "weekendsHours" TEXT;

-- DropTable
DROP TABLE "public"."WorkingHour";
