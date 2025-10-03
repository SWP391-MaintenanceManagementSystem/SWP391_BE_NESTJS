/*
  Warnings:

  - The `repeat_days` column on the `shifts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."shifts" DROP COLUMN "repeat_days",
ADD COLUMN     "repeat_days" INTEGER[];
