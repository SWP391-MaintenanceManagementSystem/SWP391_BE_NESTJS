/*
  Warnings:

  - You are about to drop the column `duration_days` on the `memberships` table. All the data in the column will be lost.
  - Added the required column `duration` to the `memberships` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodType` to the `memberships` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."PeriodType" AS ENUM ('DAY', 'MONTH', 'YEAR');

-- AlterTable
ALTER TABLE "public"."memberships" DROP COLUMN "duration_days",
ADD COLUMN     "duration" INTEGER NOT NULL,
ADD COLUMN     "periodType" "public"."PeriodType" NOT NULL;
