/*
  Warnings:

  - You are about to drop the `_FileInstanceToPrivateMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_FileInstanceToPrivateMessage" DROP CONSTRAINT "_FileInstanceToPrivateMessage_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_FileInstanceToPrivateMessage" DROP CONSTRAINT "_FileInstanceToPrivateMessage_B_fkey";

-- AlterTable
ALTER TABLE "public"."PrivateMessage" ADD COLUMN     "files" TEXT[];

-- DropTable
DROP TABLE "public"."_FileInstanceToPrivateMessage";
