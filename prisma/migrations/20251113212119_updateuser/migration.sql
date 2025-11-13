-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "customerInquiryAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emirate" TEXT,
ADD COLUMN     "freeProductsListing" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hasPaid" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEmailNotification" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isTrialActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "productApprovalAlerts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialEndDate" TIMESTAMP(3),
ADD COLUMN     "trialStartDate" TIMESTAMP(3);
