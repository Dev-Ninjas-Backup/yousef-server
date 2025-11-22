/*
  Warnings:

  - Added the required column `createdById` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add the column as nullable first
ALTER TABLE "public"."products" ADD COLUMN "createdById" TEXT;

-- Step 2: Update existing products with a default user (first user in the system)
-- You may need to adjust this query based on your specific requirements
UPDATE "public"."products" 
SET "createdById" = (
  SELECT "id" FROM "public"."users" 
  WHERE "role" = 'GARAGE_OWNER' 
  LIMIT 1
)
WHERE "createdById" IS NULL;

-- Step 3: If no garage owner exists, use the first user
UPDATE "public"."products" 
SET "createdById" = (
  SELECT "id" FROM "public"."users" 
  LIMIT 1
)
WHERE "createdById" IS NULL;

-- Step 4: Make the column NOT NULL
ALTER TABLE "public"."products" ALTER COLUMN "createdById" SET NOT NULL;

-- Step 5: Add the foreign key constraint
ALTER TABLE "public"."products" ADD CONSTRAINT "products_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
