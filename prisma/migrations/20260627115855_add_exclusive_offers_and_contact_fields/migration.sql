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

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "attachment" TEXT;

-- AlterEnum
ALTER TYPE "ContactSubject" ADD VALUE 'EXCLUSIVE_OFFER';
