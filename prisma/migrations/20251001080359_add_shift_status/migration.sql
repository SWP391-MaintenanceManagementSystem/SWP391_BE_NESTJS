-- CreateEnum
CREATE TYPE "public"."ShiftStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "public"."shifts" ADD COLUMN     "status" "public"."ShiftStatus" NOT NULL DEFAULT 'ACTIVE';
