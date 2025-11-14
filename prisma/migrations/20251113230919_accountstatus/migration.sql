/*
  Warnings:

  - You are about to drop the column `customerInquiryAlerts` on the `users` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."ContactSubject" AS ENUM ('CAR_PARTS', 'CAR_SERVICE', 'OTHERS');

-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "customerInquiryAlerts",
ADD COLUMN     "isCustomerInquiryAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEmailPromotional" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSmsNotification" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" TEXT NOT NULL,
    "FirstName" TEXT NOT NULL,
    "LastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" "public"."ContactSubject" NOT NULL,
    "message" TEXT NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ExclusiveOffer" (
    "id" TEXT NOT NULL,
    "bannerImage" TEXT NOT NULL,
    "validUnit" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "ExclusiveOffer_pkey" PRIMARY KEY ("id")
);
