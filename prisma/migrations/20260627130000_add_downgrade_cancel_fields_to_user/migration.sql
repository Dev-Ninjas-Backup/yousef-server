-- AlterTable
ALTER TABLE "users" ADD COLUMN "productMonthlyPendingPlanType" TEXT;
ALTER TABLE "users" ADD COLUMN "productMonthlyCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
