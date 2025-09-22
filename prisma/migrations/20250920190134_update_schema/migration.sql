/*
  Warnings:

  - You are about to drop the column `plate` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the `VehicleModel` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[vin]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[license_plate]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `license_plate` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vin` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."VehicleStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- DropForeignKey
ALTER TABLE "public"."VehicleModel" DROP CONSTRAINT "VehicleModel_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicles" DROP CONSTRAINT "vehicles_model_id_fkey";

-- DropIndex
DROP INDEX "public"."vehicles_plate_key";

-- AlterTable
ALTER TABLE "public"."vehicles" DROP COLUMN "plate",
ADD COLUMN     "license_plate" TEXT NOT NULL,
ADD COLUMN     "status" "public"."VehicleStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "vin" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."VehicleModel";

-- CreateTable
CREATE TABLE "public"."vehicle_models" (
    "id" SERIAL NOT NULL,
    "brand_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "production_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "public"."vehicles"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_license_plate_key" ON "public"."vehicles"("license_plate");

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicle_models" ADD CONSTRAINT "vehicle_models_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
