-- CreateEnum
CREATE TYPE "public"."DayType" AS ENUM ('WEEKDAYS', 'WEEKENDS');

-- CreateTable
CREATE TABLE "public"."Garage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "coverPhoto" TEXT,
    "profileImage" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "street" TEXT,
    "city" TEXT,
    "emirate" TEXT,
    "description" TEXT,
    "certifications" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Garage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."WorkingHour" (
    "id" TEXT NOT NULL,
    "dayType" "public"."DayType" NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "garageId" TEXT NOT NULL,

    CONSTRAINT "WorkingHour_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Service" (
    "id" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GarageService" (
    "garageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,

    CONSTRAINT "GarageService_pkey" PRIMARY KEY ("garageId","serviceId")
);

-- CreateTable
CREATE TABLE "public"."BrandExpertise" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "BrandExpertise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."GarageBrand" (
    "garageId" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,

    CONSTRAINT "GarageBrand_pkey" PRIMARY KEY ("garageId","brandId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Garage_name_key" ON "public"."Garage"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Garage_email_key" ON "public"."Garage"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WorkingHour_garageId_dayType_key" ON "public"."WorkingHour"("garageId", "dayType");

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "public"."Service"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BrandExpertise_name_key" ON "public"."BrandExpertise"("name");

-- AddForeignKey
ALTER TABLE "public"."WorkingHour" ADD CONSTRAINT "WorkingHour_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "public"."Garage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GarageService" ADD CONSTRAINT "GarageService_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "public"."Garage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GarageService" ADD CONSTRAINT "GarageService_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GarageBrand" ADD CONSTRAINT "GarageBrand_garageId_fkey" FOREIGN KEY ("garageId") REFERENCES "public"."Garage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GarageBrand" ADD CONSTRAINT "GarageBrand_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."BrandExpertise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
