-- AlterTable
ALTER TABLE "public"."payments" ADD COLUMN     "planId" TEXT;

-- CreateTable
CREATE TABLE "public"."PaymentPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "Price" INTEGER NOT NULL,
    "billingCycle" TEXT NOT NULL,
    "shortBio" TEXT,
    "features" TEXT[],

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."PaymentPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
