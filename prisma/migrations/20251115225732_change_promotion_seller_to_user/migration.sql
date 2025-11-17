/*
  Warnings:

  - You are about to drop the column `sellerId` on the `Promotion` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Promotion` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Promotion" DROP CONSTRAINT "Promotion_sellerId_fkey";

-- AlterTable
ALTER TABLE "public"."Promotion" DROP COLUMN "sellerId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Promotion" ADD CONSTRAINT "Promotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
