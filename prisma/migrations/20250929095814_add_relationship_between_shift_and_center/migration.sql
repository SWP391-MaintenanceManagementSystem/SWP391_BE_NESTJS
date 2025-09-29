/*
  Warnings:

  - You are about to drop the column `deletedAt` on the `vehicles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."vehicles" DROP COLUMN "deletedAt",
ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "public"."shifts" ADD CONSTRAINT "shifts_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "public"."service_centers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
