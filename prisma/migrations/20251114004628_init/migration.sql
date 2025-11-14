-- DropForeignKey
ALTER TABLE "public"."GarageService" DROP CONSTRAINT "GarageService_garageId_fkey";

-- DropForeignKey
ALTER TABLE "public"."GarageService" DROP CONSTRAINT "GarageService_serviceId_fkey";

-- AddForeignKey
ALTER TABLE "public"."GarageService" ADD CONSTRAINT "GarageService_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "public"."Garage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GarageService" ADD CONSTRAINT "GarageService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
