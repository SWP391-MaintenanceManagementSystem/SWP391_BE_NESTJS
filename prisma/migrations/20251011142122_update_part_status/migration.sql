/*
  Warnings:

  - You are about to drop the column `status` on the `service_parts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."parts" ADD COLUMN     "status" "public"."PartStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "public"."service_parts" DROP COLUMN "status";
