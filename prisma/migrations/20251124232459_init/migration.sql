/*
  Warnings:

  - You are about to drop the column `planId` on the `payments` table. All the data in the column will be lost.
  - The `status` column on the `payments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `payment_plans` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `paymentType` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PaymentType" AS ENUM ('GARAGE_SUBSCRIPTION', 'PAY_PER_PRODUCT', 'PRODUCT_PROMOTION_CREDIT', 'PRODUCT_PROMOTION', 'GENERAL');

-- CreateEnum
CREATE TYPE "public"."SubscriptionType" AS ENUM ('TRIAL', 'PAID');

-- CreateEnum
CREATE TYPE "public"."SubscriptionStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_planId_fkey";

-- AlterTable
ALTER TABLE "public"."payments" DROP COLUMN "planId",
ADD COLUMN     "garageSubscriptionId" TEXT,
ADD COLUMN     "paymentType" "public"."PaymentType" NOT NULL,
ALTER COLUMN "currency" SET DEFAULT 'usd',
DROP COLUMN "status",
ADD COLUMN     "status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING';

-- DropTable
DROP TABLE "public"."payment_plans";

-- CreateTable
CREATE TABLE "public"."garage_subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "public"."SubscriptionType" NOT NULL,
    "amount" INTEGER,
    "currency" TEXT,
    "stripeSessionId" TEXT,
    "stripePaymentId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "billingCycle" "public"."BillingCycle",
    "status" "public"."SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "garage_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "garage_subscriptions_stripeSessionId_key" ON "public"."garage_subscriptions"("stripeSessionId");

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_garageSubscriptionId_fkey" FOREIGN KEY ("garageSubscriptionId") REFERENCES "public"."garage_subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."garage_subscriptions" ADD CONSTRAINT "garage_subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
