/*
  Warnings:

  - A unique constraint covering the columns `[session_id]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."transactions" ADD COLUMN     "session_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "transactions_session_id_key" ON "public"."transactions"("session_id");
