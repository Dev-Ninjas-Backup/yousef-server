/*
  Warnings:

  - You are about to drop the `GarageService` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Service` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "GarageService" DROP CONSTRAINT "GarageService_garageId_fkey";

-- DropForeignKey
ALTER TABLE "GarageService" DROP CONSTRAINT "GarageService_serviceId_fkey";

-- AlterTable
ALTER TABLE "Garage" ADD COLUMN     "services" TEXT[];

-- DropTable
DROP TABLE "GarageService";

-- DropTable
DROP TABLE "Service";
