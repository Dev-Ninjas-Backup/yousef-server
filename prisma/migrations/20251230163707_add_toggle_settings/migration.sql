-- AlterTable
ALTER TABLE "GeneralSetting" ADD COLUMN     "isAutoApproveGarages" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isAutoApproveParts" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEmailNotificationEnabled" BOOLEAN NOT NULL DEFAULT true;
