-- AlterTable
ALTER TABLE "products" ADD COLUMN     "garageId" TEXT;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "Garage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
