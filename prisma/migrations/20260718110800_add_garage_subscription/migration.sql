-- AlterTable
ALTER TABLE "Garage" ADD COLUMN     "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "nextSubscriptionBillingDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionCancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSubscriptionTrialActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "subscriptionTrialStartDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionTrialEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "garage_subscriptions" ADD COLUMN     "garageId" TEXT;

-- AddForeignKey
ALTER TABLE "garage_subscriptions" ADD CONSTRAINT "garage_subscriptions_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
