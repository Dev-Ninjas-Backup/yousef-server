-- DropForeignKey
ALTER TABLE "public"."PrivateMessage" DROP CONSTRAINT "PrivateMessage_fileId_fkey";

-- AlterTable
ALTER TABLE "public"."PrivateMessage" ADD COLUMN     "file" TEXT;
