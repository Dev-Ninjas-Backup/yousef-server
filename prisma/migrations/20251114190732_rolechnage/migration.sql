-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "isGarageVerified" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "role" SET DEFAULT 'CAR_OWNER';
