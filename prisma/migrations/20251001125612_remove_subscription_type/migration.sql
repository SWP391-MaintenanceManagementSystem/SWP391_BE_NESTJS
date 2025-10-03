/*
  Warnings:

  - The values [ONLINE] on the enum `Method` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `type` on the `subscriptions` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."Method_new" AS ENUM ('CASH', 'CARD');
ALTER TABLE "public"."transactions" ALTER COLUMN "method" TYPE "public"."Method_new" USING ("method"::text::"public"."Method_new");
ALTER TYPE "public"."Method" RENAME TO "Method_old";
ALTER TYPE "public"."Method_new" RENAME TO "Method";
DROP TYPE "public"."Method_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."subscriptions" DROP COLUMN "type";
