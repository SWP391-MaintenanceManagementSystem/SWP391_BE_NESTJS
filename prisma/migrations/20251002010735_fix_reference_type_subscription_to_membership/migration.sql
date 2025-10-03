/*
  Warnings:

  - The enum value `SUBSCRIPTION` on the enum `ReferenceType` will be renamed to `MEMBERSHIP`.

*/
-- AlterEnum
ALTER TYPE "public"."ReferenceType" RENAME VALUE 'SUBSCRIPTION' TO 'MEMBERSHIP';
