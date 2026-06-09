-- AlterTable
ALTER TABLE "Garage" ADD COLUMN     "requestedBrandExpertise" TEXT[] DEFAULT ARRAY[]::TEXT[];
