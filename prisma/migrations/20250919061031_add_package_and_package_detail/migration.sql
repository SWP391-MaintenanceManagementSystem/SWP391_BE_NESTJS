/*
  Warnings:

  - The values [IN_PROGRESS] on the enum `BookingStatus` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `accounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accountId` on the `accounts` table. All the data in the column will be lost.
  - You are about to drop the column `providerId` on the `accounts` table. All the data in the column will be lost.
  - The `role` column on the `accounts` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `first_name` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `admins` table. All the data in the column will be lost.
  - You are about to drop the column `assigned_by` on the `booking_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `booking_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `booking_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `booking_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `booking_assignments` table. All the data in the column will be lost.
  - The primary key for the `booking_details` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `price` on the `booking_details` table. All the data in the column will be lost.
  - You are about to drop the column `booking_datetime` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `certificate_id` on the `employee_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `employee_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `employee_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `employee_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `employee_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `valid_from` on the `employee_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `valid_to` on the `employee_certificates` table. All the data in the column will be lost.
  - You are about to drop the column `experience_years` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `specialization` on the `employees` table. All the data in the column will be lost.
  - You are about to drop the column `close_time` on the `service_centers` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `service_centers` table. All the data in the column will be lost.
  - You are about to drop the column `open_time` on the `service_centers` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `service_centers` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `service_centers` table. All the data in the column will be lost.
  - You are about to drop the column `base_price` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `duration_minutes` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `services` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `membership_id` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `subscriptions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `subscriptions` table. All the data in the column will be lost.
  - The primary key for the `tokens` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `accountId` on the `tokens` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `tokens` table. All the data in the column will be lost.
  - You are about to drop the column `expiredAt` on the `tokens` table. All the data in the column will be lost.
  - You are about to drop the column `tokenId` on the `tokens` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `tokens` table. All the data in the column will be lost.
  - You are about to drop the column `paid_at` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `payment_status` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `reference_id` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `reference_type` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `color` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `license_plate` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `model_id` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `vin` on the `vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `work_centers` table. All the data in the column will be lost.
  - You are about to drop the column `end_date` on the `work_centers` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `work_centers` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `work_centers` table. All the data in the column will be lost.
  - You are about to drop the column `end_time` on the `work_schedules` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `work_schedules` table. All the data in the column will be lost.
  - You are about to drop the `categories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `certificates` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `memberships` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `parts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `service_parts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vehicle_models` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[plate]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `accounts` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `full_name` to the `admins` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `booking_details` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `unit_price` to the `booking_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `booking_details` table without a default value. This is not possible if the table is not empty.
  - Added the required column `booking_date` to the `bookings` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `employee_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `issued_at` to the `employee_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `employee_certificates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `services` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `start_time` on the `shifts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `end_time` on the `shifts` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `subscriptions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_id` to the `tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expires_at` to the `tokens` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `tokens` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `booking_id` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `brand` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plate` to the `vehicles` table without a default value. This is not possible if the table is not empty.
  - Made the column `year` on table `vehicles` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "public"."AccountRole" AS ENUM ('ADMIN', 'STAFF', 'TECHNICIAN', 'CUSTOMER', 'PREMIUM');

-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "public"."BookingStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
ALTER TABLE "public"."bookings" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."bookings" ALTER COLUMN "status" TYPE "public"."BookingStatus_new" USING ("status"::text::"public"."BookingStatus_new");
ALTER TYPE "public"."BookingStatus" RENAME TO "BookingStatus_old";
ALTER TYPE "public"."BookingStatus_new" RENAME TO "BookingStatus";
DROP TYPE "public"."BookingStatus_old";
ALTER TABLE "public"."bookings" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."admins" DROP CONSTRAINT "admins_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."booking_details" DROP CONSTRAINT "booking_details_service_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."customers" DROP CONSTRAINT "customers_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employee_certificates" DROP CONSTRAINT "employee_certificates_certificate_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."employees" DROP CONSTRAINT "employees_account_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."parts" DROP CONSTRAINT "parts_category_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."service_parts" DROP CONSTRAINT "service_parts_part_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."service_parts" DROP CONSTRAINT "service_parts_service_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."shifts" DROP CONSTRAINT "shifts_center_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."subscriptions" DROP CONSTRAINT "subscriptions_membership_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."tokens" DROP CONSTRAINT "tokens_accountId_fkey";

-- DropForeignKey
ALTER TABLE "public"."vehicles" DROP CONSTRAINT "vehicles_model_id_fkey";

-- DropIndex
DROP INDEX "public"."bookings_booking_datetime_idx";

-- DropIndex
DROP INDEX "public"."employee_certificates_employee_id_certificate_id_key";

-- DropIndex
DROP INDEX "public"."subscriptions_customer_id_idx";

-- DropIndex
DROP INDEX "public"."subscriptions_end_date_idx";

-- DropIndex
DROP INDEX "public"."subscriptions_status_idx";

-- DropIndex
DROP INDEX "public"."tokens_accountId_idx";

-- DropIndex
DROP INDEX "public"."transactions_customer_id_idx";

-- DropIndex
DROP INDEX "public"."transactions_payment_status_idx";

-- DropIndex
DROP INDEX "public"."transactions_reference_type_reference_id_idx";

-- DropIndex
DROP INDEX "public"."vehicles_license_plate_key";

-- DropIndex
DROP INDEX "public"."vehicles_vin_key";

-- DropIndex
DROP INDEX "public"."work_schedules_date_idx";

-- DropIndex
DROP INDEX "public"."work_schedules_employee_id_date_shift_id_key";

-- AlterTable
ALTER TABLE "public"."accounts" DROP CONSTRAINT "accounts_pkey",
DROP COLUMN "accountId",
DROP COLUMN "providerId",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "provider_id" JSONB,
DROP COLUMN "role",
ADD COLUMN     "role" "public"."AccountRole" NOT NULL DEFAULT 'CUSTOMER',
ADD CONSTRAINT "accounts_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."admins" DROP COLUMN "first_name",
DROP COLUMN "last_name",
ADD COLUMN     "full_name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."booking_assignments" DROP COLUMN "assigned_by",
DROP COLUMN "created_at",
DROP COLUMN "notes",
DROP COLUMN "status",
DROP COLUMN "updated_at";

-- AlterTable
ALTER TABLE "public"."booking_details" DROP CONSTRAINT "booking_details_pkey",
DROP COLUMN "price",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "package_id" TEXT,
ADD COLUMN     "unit_price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "service_id" DROP NOT NULL,
ALTER COLUMN "quantity" DROP DEFAULT,
ADD CONSTRAINT "booking_details_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."bookings" DROP COLUMN "booking_datetime",
ADD COLUMN     "booking_date" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."employee_certificates" DROP COLUMN "certificate_id",
DROP COLUMN "created_at",
DROP COLUMN "notes",
DROP COLUMN "status",
DROP COLUMN "updated_at",
DROP COLUMN "valid_from",
DROP COLUMN "valid_to",
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "issued_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."employees" DROP COLUMN "experience_years",
DROP COLUMN "specialization";

-- AlterTable
ALTER TABLE "public"."service_centers" DROP COLUMN "close_time",
DROP COLUMN "email",
DROP COLUMN "open_time",
DROP COLUMN "phone",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "public"."services" DROP COLUMN "base_price",
DROP COLUMN "description",
DROP COLUMN "duration_minutes",
DROP COLUMN "type",
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."shifts" ADD COLUMN     "end_date" TIMESTAMP(3),
ADD COLUMN     "maximum_slot" INTEGER,
ADD COLUMN     "start_date" TIMESTAMP(3),
DROP COLUMN "start_time",
ADD COLUMN     "start_time" TIMESTAMP(3) NOT NULL,
DROP COLUMN "end_time",
ADD COLUMN     "end_time" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "repeat_days" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."subscriptions" DROP COLUMN "created_at",
DROP COLUMN "membership_id",
DROP COLUMN "status",
DROP COLUMN "updated_at",
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "public"."tokens" DROP CONSTRAINT "tokens_pkey",
DROP COLUMN "accountId",
DROP COLUMN "createdAt",
DROP COLUMN "expiredAt",
DROP COLUMN "tokenId",
DROP COLUMN "updatedAt",
ADD COLUMN     "account_id" TEXT NOT NULL,
ADD COLUMN     "expires_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "tokens_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "public"."transactions" DROP COLUMN "paid_at",
DROP COLUMN "payment_method",
DROP COLUMN "payment_status",
DROP COLUMN "reference_id",
DROP COLUMN "reference_type",
DROP COLUMN "updated_at",
ADD COLUMN     "booking_id" TEXT NOT NULL,
ADD COLUMN     "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "public"."vehicles" DROP COLUMN "color",
DROP COLUMN "license_plate",
DROP COLUMN "model_id",
DROP COLUMN "vin",
ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "model" TEXT NOT NULL,
ADD COLUMN     "plate" TEXT NOT NULL,
ALTER COLUMN "year" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."work_centers" DROP COLUMN "created_at",
DROP COLUMN "end_date",
DROP COLUMN "start_date",
DROP COLUMN "updated_at",
ADD COLUMN     "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."work_schedules" DROP COLUMN "end_time",
DROP COLUMN "start_time",
ALTER COLUMN "date" SET DATA TYPE TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."categories";

-- DropTable
DROP TABLE "public"."certificates";

-- DropTable
DROP TABLE "public"."memberships";

-- DropTable
DROP TABLE "public"."parts";

-- DropTable
DROP TABLE "public"."service_parts";

-- DropTable
DROP TABLE "public"."vehicle_models";

-- DropEnum
DROP TYPE "public"."EmployeeCertificateStatus";

-- DropEnum
DROP TYPE "public"."PaymentStatus";

-- DropEnum
DROP TYPE "public"."TransactionReferenceType";

-- DropEnum
DROP TYPE "public"."UserRole";

-- CreateTable
CREATE TABLE "public"."packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."package_details" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "package_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_booking_date_idx" ON "public"."bookings"("booking_date");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "public"."vehicles"("plate");

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_details" ADD CONSTRAINT "booking_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_details" ADD CONSTRAINT "booking_details_package_id_fkey" FOREIGN KEY ("package_id") REFERENCES "public"."packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."package_details" ADD CONSTRAINT "package_details_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."package_details" ADD CONSTRAINT "package_details_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."tokens" ADD CONSTRAINT "tokens_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
