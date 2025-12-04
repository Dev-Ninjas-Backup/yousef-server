/*
  Warnings:

  - You are about to drop the column `rating` on the `Review` table. All the data in the column will be lost.
  - Added the required column `overallExperience` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceQuality` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timeliness` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `valueForMoney` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Review" DROP COLUMN "rating",
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "overallExperience" INTEGER NOT NULL,
ADD COLUMN     "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "recommendation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "serviceQuality" INTEGER NOT NULL,
ADD COLUMN     "timeliness" INTEGER NOT NULL,
ADD COLUMN     "valueForMoney" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "Review_garageId_idx" ON "public"."Review"("garageId");

-- CreateIndex
CREATE INDEX "Review_userId_idx" ON "public"."Review"("userId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "public"."Review"("createdAt");

-- CreateIndex
CREATE INDEX "Review_isVisible_idx" ON "public"."Review"("isVisible");

-- CreateIndex
CREATE INDEX "Review_overallExperience_idx" ON "public"."Review"("overallExperience");
