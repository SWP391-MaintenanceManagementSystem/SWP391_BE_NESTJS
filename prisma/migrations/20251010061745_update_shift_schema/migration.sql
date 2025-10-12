/*
  Warnings:

  - You are about to drop the column `end_date` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the column `repeat_days` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the column `start_date` on the `shifts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."shifts" DROP COLUMN "end_date",
DROP COLUMN "repeat_days",
DROP COLUMN "start_date";
