-- AlterTable
ALTER TABLE "PaymentConfigure" ADD COLUMN     "monthlyBasicPrice" TEXT DEFAULT '29',
ADD COLUMN     "monthlyGaragePrice" TEXT DEFAULT '99',
ADD COLUMN     "monthlyProPrice" TEXT DEFAULT '59',
ADD COLUMN     "promotionalAdPrice3Days" TEXT DEFAULT '49',
ADD COLUMN     "promotionalAdPrice7Days" TEXT DEFAULT '99';

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "expiresAt" TIMESTAMP(3),
ADD COLUMN     "listingPlan" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "productMonthlyPlanType" TEXT;
