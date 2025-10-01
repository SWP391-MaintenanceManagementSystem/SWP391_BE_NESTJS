/*
  Warnings:

  - You are about to drop the column `booking_id` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `membership_id` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."ReferenceType" AS ENUM ('BOOKING', 'MEMBERSHIP');

-- CreateEnum
CREATE TYPE "public"."Method" AS ENUM ('CASH', 'ONLINE');

-- DropForeignKey
ALTER TABLE "public"."transactions" DROP CONSTRAINT "transactions_booking_id_fkey";

-- AlterTable
ALTER TABLE "public"."subscriptions" ADD COLUMN     "membership_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."transactions" DROP COLUMN "booking_id",
ADD COLUMN     "method" "public"."Method" NOT NULL,
ADD COLUMN     "reference_id" TEXT,
ADD COLUMN     "reference_type" "public"."ReferenceType",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "public"."memberships" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
