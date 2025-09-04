/*
  Warnings:

  - You are about to drop the column `isBanned` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `isVerified` on the `Account` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."AccountStatus" AS ENUM ('VERIFIED', 'NOT_VERIFY', 'BANNED', 'DISABLED');

-- AlterTable
ALTER TABLE "public"."Account" DROP COLUMN "isBanned",
DROP COLUMN "isVerified",
ADD COLUMN     "status" "public"."AccountStatus" NOT NULL DEFAULT 'NOT_VERIFY';
