-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "attachment" TEXT,
ADD COLUMN     "priceBeforeDiscount" TEXT,
ADD COLUMN     "priceAfterDiscount" TEXT;

-- AlterTable
ALTER TABLE "ExclusiveOffer" ADD COLUMN     "originalPrice" TEXT,
ADD COLUMN     "price" TEXT,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "garageId" TEXT;
