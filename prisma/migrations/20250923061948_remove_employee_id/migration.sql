/*
  Warnings:

  - You are about to drop the column `employee_id` on the `employees` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "public"."BookingStatus" ADD VALUE 'IN_PROCESS';

-- DropIndex
DROP INDEX "public"."employees_employee_id_key";

-- AlterTable
ALTER TABLE "public"."employees" DROP COLUMN "employee_id";
