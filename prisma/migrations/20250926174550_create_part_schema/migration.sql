/*
  Warnings:

  - The primary key for the `package_details` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `package_details` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."BookingStatus" ADD VALUE 'CHECKED_IN';

-- AlterTable
ALTER TABLE "public"."package_details" DROP CONSTRAINT "package_details_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "package_details_pkey" PRIMARY KEY ("packageId", "serviceId");

-- AlterTable
ALTER TABLE "public"."services" ADD COLUMN     "description" TEXT;

-- CreateTable
CREATE TABLE "public"."parts" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "name" TEXT NOT NULL,
    "stock" INTEGER NOT NULL,
    "min_stock" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_parts" (
    "id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_parts_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."parts" ADD CONSTRAINT "parts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_parts" ADD CONSTRAINT "service_parts_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_parts" ADD CONSTRAINT "service_parts_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
