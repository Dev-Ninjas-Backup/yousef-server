-- CreateTable
CREATE TABLE "PaymentConfigure" (
    "id" TEXT NOT NULL,
    "sparePartsMonthly" TEXT,
    "perListingPrice" TEXT,
    "promotionalAdPrice" TEXT,
    "freePromotionalListings" TEXT,
    "freePromotionalListingStatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PaymentConfigure_pkey" PRIMARY KEY ("id")
);
