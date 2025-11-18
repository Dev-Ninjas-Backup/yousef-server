/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `PartsCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PartsCategory_name_key" ON "public"."PartsCategory"("name");
