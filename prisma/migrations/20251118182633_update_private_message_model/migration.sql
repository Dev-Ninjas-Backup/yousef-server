/*
  Warnings:

  - You are about to drop the column `file` on the `PrivateMessage` table. All the data in the column will be lost.
  - You are about to drop the column `fileId` on the `PrivateMessage` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."PrivateMessage" DROP COLUMN "file",
DROP COLUMN "fileId";

-- CreateTable
CREATE TABLE "public"."_FileInstanceToPrivateMessage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FileInstanceToPrivateMessage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FileInstanceToPrivateMessage_B_index" ON "public"."_FileInstanceToPrivateMessage"("B");

-- AddForeignKey
ALTER TABLE "public"."_FileInstanceToPrivateMessage" ADD CONSTRAINT "_FileInstanceToPrivateMessage_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."file_instance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_FileInstanceToPrivateMessage" ADD CONSTRAINT "_FileInstanceToPrivateMessage_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."PrivateMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
