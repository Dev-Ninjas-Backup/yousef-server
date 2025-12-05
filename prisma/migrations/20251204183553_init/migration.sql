/*
  Warnings:

  - You are about to drop the `garageAdminNotification` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."garageAdminNotification" DROP CONSTRAINT "garageAdminNotification_userId_fkey";

-- DropTable
DROP TABLE "public"."garageAdminNotification";

-- CreateTable
CREATE TABLE "public"."garage_admin_notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "emailNotification" BOOLEAN NOT NULL DEFAULT false,
    "customerInquiryNotification" BOOLEAN NOT NULL DEFAULT false,
    "productApprovalNotification" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "garage_admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "garage_admin_notifications_userId_key" ON "public"."garage_admin_notifications"("userId");

-- AddForeignKey
ALTER TABLE "public"."garage_admin_notifications" ADD CONSTRAINT "garage_admin_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
