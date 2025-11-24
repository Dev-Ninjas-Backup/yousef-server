-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "isSubscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSubscriptionTrialActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextSubscriptionBillingDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionTrialEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionTrialStartDate" TIMESTAMP(3);
