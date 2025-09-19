/*
  Warnings:

  - You are about to drop the column `brand` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `model` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `vehicles` table. All the data in the column will be lost.
  - Added the required column `vehicle_model_id` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."vehicles" DROP COLUMN "brand",
DROP COLUMN "model",
DROP COLUMN "year",
ADD COLUMN     "vehicle_model_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."VehicleModel" (
    "id" SERIAL NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "production_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_vehicle_model_id_fkey" FOREIGN KEY ("vehicle_model_id") REFERENCES "public"."VehicleModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
