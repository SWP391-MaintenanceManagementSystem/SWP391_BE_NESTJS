/*
  Warnings:

  - Added the required column `shift_id` to the `bookings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."bookings" ADD COLUMN     "shift_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."bookings" ADD CONSTRAINT "bookings_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
