/*
  Warnings:

  - The `role` column on the `accounts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."AccountRole" AS ENUM ('ADMIN', 'STAFF', 'TECHNICIAN', 'CUSTOMER', 'PREMIUM');

-- AlterTable
ALTER TABLE "public"."accounts" DROP COLUMN "role",
ADD COLUMN     "role" "public"."AccountRole" NOT NULL DEFAULT 'CUSTOMER';

-- DropEnum
DROP TYPE "public"."UserRole";
