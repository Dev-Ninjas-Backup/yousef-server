-- CreateTable
CREATE TABLE "public"."garageAdminNotification" (
    "id" TEXT NOT NULL,
    "emailNotification" BOOLEAN NOT NULL DEFAULT false,
    "customerInquiryNotification" BOOLEAN NOT NULL DEFAULT false,
    "productApprovalNotification" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE UNIQUE INDEX "garageAdminNotification_id_key" ON "public"."garageAdminNotification"("id");
