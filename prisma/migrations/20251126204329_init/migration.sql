-- AlterEnum
ALTER TYPE "public"."PaymentType" ADD VALUE 'MONTHLY_PEY_PRODUCT';

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "productMonthlyActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "productMonthlyEndDate" TIMESTAMP(3),
ADD COLUMN     "productMonthlyStartDate" TIMESTAMP(3);
