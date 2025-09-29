-- CreateEnum
CREATE TYPE "public"."ServiceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "public"."services" ADD COLUMN     "status" "public"."ServiceStatus" NOT NULL DEFAULT 'ACTIVE';
