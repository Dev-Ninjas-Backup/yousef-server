/*
  Warnings:

  - You are about to drop the column `communication` on the `NotificationToggle` table. All the data in the column will be lost.
  - You are about to drop the column `contentStatus` on the `NotificationToggle` table. All the data in the column will be lost.
  - You are about to drop the column `scheduling` on the `NotificationToggle` table. All the data in the column will be lost.
  - You are about to drop the column `surveyAndPoll` on the `NotificationToggle` table. All the data in the column will be lost.
  - You are about to drop the column `tasksAndProjects` on the `NotificationToggle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NotificationToggle" DROP COLUMN "communication",
DROP COLUMN "contentStatus",
DROP COLUMN "scheduling",
DROP COLUMN "surveyAndPoll",
DROP COLUMN "tasksAndProjects",
ADD COLUMN     "CustomerInquiryAlert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "NewMessage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ProductApproveUpdate" BOOLEAN NOT NULL DEFAULT false;
