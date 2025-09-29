-- CreateEnum
CREATE TYPE "public"."CenterStatus" AS ENUM ('OPEN', 'CLOSED');

-- AlterTable
ALTER TABLE "public"."service_centers" ADD COLUMN     "status" "public"."CenterStatus" NOT NULL DEFAULT 'OPEN';
