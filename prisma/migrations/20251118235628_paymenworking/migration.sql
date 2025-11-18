-- CreateTable
CREATE TABLE "public"."PaymentSetting" (
    "id" TEXT NOT NULL,
    "platformCommission" INTEGER NOT NULL,
    "MinimumPayout" INTEGER NOT NULL,

    CONSTRAINT "PaymentSetting_pkey" PRIMARY KEY ("id")
);
