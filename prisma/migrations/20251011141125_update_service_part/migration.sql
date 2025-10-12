-- CreateEnum
CREATE TYPE "public"."PartStatus" AS ENUM ('OUT_OF_STOCK', 'AVAILABLE', 'DISCONTINUED');

-- AlterTable
ALTER TABLE "public"."service_parts" ADD COLUMN     "status" "public"."PartStatus" NOT NULL DEFAULT 'AVAILABLE';
