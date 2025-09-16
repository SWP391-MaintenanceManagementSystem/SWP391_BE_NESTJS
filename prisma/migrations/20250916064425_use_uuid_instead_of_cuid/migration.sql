/*
  Warnings:

  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Token` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN', 'STAFF', 'TECHNICIAN', 'CUSTOMER', 'PREMIUM');

-- CreateEnum
CREATE TYPE "public"."BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "public"."TransactionReferenceType" AS ENUM ('BOOKING', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "public"."EmployeeCertificateStatus" AS ENUM ('ACTIVE', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "public"."Token" DROP CONSTRAINT "FK_Token_account_id_Account_id";

-- DropTable
DROP TABLE "public"."Account";

-- DropTable
DROP TABLE "public"."Token";

-- DropEnum
DROP TYPE "public"."Role";

-- CreateTable
CREATE TABLE "public"."accounts" (
    "accountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "phone" TEXT,
    "role" "public"."UserRole" NOT NULL,
    "status" "public"."AccountStatus" NOT NULL DEFAULT 'NOT_VERIFY',
    "avatar" TEXT,
    "provider" "public"."AuthProvider"[] DEFAULT ARRAY['EMAIL']::"public"."AuthProvider"[],
    "providerId" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("accountId")
);

-- CreateTable
CREATE TABLE "public"."tokens" (
    "tokenId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiredAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("tokenId")
);

-- CreateTable
CREATE TABLE "public"."employees" (
    "account_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "specialization" TEXT,
    "experience_years" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "public"."certificates" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."employee_certificates" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "certificate_id" INTEGER NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_to" TIMESTAMP(3),
    "status" "public"."EmployeeCertificateStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admins" (
    "account_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "public"."customers" (
    "account_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "address" TEXT,
    "is_premium" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("account_id")
);

-- CreateTable
CREATE TABLE "public"."work_schedules" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "shift_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shifts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "start_time" TIME NOT NULL,
    "end_time" TIME NOT NULL,
    "repeat_days" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_centers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "open_time" TIME NOT NULL,
    "close_time" TIME NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."work_centers" (
    "id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "work_centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicles" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "year" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."vehicle_models" (
    "id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "battery_capacity" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicle_models_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."bookings" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "center_id" TEXT NOT NULL,
    "total_cost" DOUBLE PRECISION NOT NULL,
    "status" "public"."BookingStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "booking_datetime" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."booking_details" (
    "booking_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "price" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "booking_details_pkey" PRIMARY KEY ("booking_id","service_id")
);

-- CreateTable
CREATE TABLE "public"."booking_assignments" (
    "id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "booking_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."services" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "base_price" DOUBLE PRECISION NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."service_parts" (
    "service_id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "quantity_required" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_parts_pkey" PRIMARY KEY ("service_id","part_id")
);

-- CreateTable
CREATE TABLE "public"."parts" (
    "part_id" TEXT NOT NULL,
    "category_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "stock" INTEGER NOT NULL,
    "min_stock_level" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "brand" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parts_pkey" PRIMARY KEY ("part_id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "category_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("category_id")
);

-- CreateTable
CREATE TABLE "public"."transactions" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "reference_type" "public"."TransactionReferenceType" NOT NULL,
    "reference_id" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "payment_status" "public"."PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."subscriptions" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "membership_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."memberships" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "duration_days" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_email_key" ON "public"."accounts"("email");

-- CreateIndex
CREATE INDEX "tokens_accountId_idx" ON "public"."tokens"("accountId");

-- CreateIndex
CREATE UNIQUE INDEX "employees_employee_id_key" ON "public"."employees"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "employee_certificates_employee_id_certificate_id_key" ON "public"."employee_certificates"("employee_id", "certificate_id");

-- CreateIndex
CREATE INDEX "work_schedules_date_idx" ON "public"."work_schedules"("date");

-- CreateIndex
CREATE UNIQUE INDEX "work_schedules_employee_id_date_shift_id_key" ON "public"."work_schedules"("employee_id", "date", "shift_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "public"."vehicles"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_license_plate_key" ON "public"."vehicles"("license_plate");

-- CreateIndex
CREATE INDEX "bookings_customer_id_idx" ON "public"."bookings"("customer_id");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "public"."bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_booking_datetime_idx" ON "public"."bookings"("booking_datetime");

-- CreateIndex
CREATE INDEX "transactions_customer_id_idx" ON "public"."transactions"("customer_id");

-- CreateIndex
CREATE INDEX "transactions_payment_status_idx" ON "public"."transactions"("payment_status");

-- CreateIndex
CREATE INDEX "transactions_reference_type_reference_id_idx" ON "public"."transactions"("reference_type", "reference_id");

-- CreateIndex
CREATE INDEX "subscriptions_customer_id_idx" ON "public"."subscriptions"("customer_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "public"."subscriptions"("status");

-- CreateIndex
CREATE INDEX "subscriptions_end_date_idx" ON "public"."subscriptions"("end_date");

-- AddForeignKey
ALTER TABLE "public"."tokens" ADD CONSTRAINT "tokens_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "public"."accounts"("accountId") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."employees" ADD CONSTRAINT "employees_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_certificates" ADD CONSTRAINT "employee_certificates_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."employee_certificates" ADD CONSTRAINT "employee_certificates_certificate_id_fkey" FOREIGN KEY ("certificate_id") REFERENCES "public"."certificates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admins" ADD CONSTRAINT "admins_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."customers" ADD CONSTRAINT "customers_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("accountId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_schedules" ADD CONSTRAINT "work_schedules_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_schedules" ADD CONSTRAINT "work_schedules_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."service_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_centers" ADD CONSTRAINT "work_centers_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."work_centers" ADD CONSTRAINT "work_centers_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."service_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."vehicles" ADD CONSTRAINT "vehicles_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "public"."vehicle_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "public"."vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."service_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_details" ADD CONSTRAINT "booking_details_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_details" ADD CONSTRAINT "booking_details_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_assignments" ADD CONSTRAINT "booking_assignments_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."booking_assignments" ADD CONSTRAINT "booking_assignments_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_parts" ADD CONSTRAINT "service_parts_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."service_parts" ADD CONSTRAINT "service_parts_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "public"."parts"("part_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."parts" ADD CONSTRAINT "parts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."transactions" ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("account_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."subscriptions" ADD CONSTRAINT "subscriptions_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "public"."memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
