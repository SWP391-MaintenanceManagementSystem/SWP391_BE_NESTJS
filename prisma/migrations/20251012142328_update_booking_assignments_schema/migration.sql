/*
  Warnings:

  - You are about to drop the column `assigned_at` on the `booking_assignments` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[booking_id,employee_id]` on the table `booking_assignments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `assigned_by` to the `booking_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `booking_assignments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."booking_assignments" DROP COLUMN "assigned_at",
ADD COLUMN     "assigned_by" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "booking_assignments_booking_id_employee_id_key" ON "public"."booking_assignments"("booking_id", "employee_id");

-- AddForeignKey
ALTER TABLE "public"."booking_assignments" ADD CONSTRAINT "booking_assignments_assigned_by_fkey" FOREIGN KEY ("assigned_by") REFERENCES "public"."employees"("account_id") ON DELETE RESTRICT ON UPDATE CASCADE;
