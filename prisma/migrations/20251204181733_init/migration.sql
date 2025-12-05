/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `garageAdminNotification` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `garageAdminNotification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."garageAdminNotification" ADD COLUMN     "userId" TEXT NOT NULL,
ADD CONSTRAINT "garageAdminNotification_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "public"."garageAdminNotification_id_key";

-- CreateIndex
CREATE UNIQUE INDEX "garageAdminNotification_userId_key" ON "public"."garageAdminNotification"("userId");

-- AddForeignKey
ALTER TABLE "public"."garageAdminNotification" ADD CONSTRAINT "garageAdminNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
