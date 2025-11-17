/*
  Warnings:

  - Added the required column `userId` to the `Garage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userid` to the `Garage` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Garage" ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "userid" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Garage" ADD CONSTRAINT "Garage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
