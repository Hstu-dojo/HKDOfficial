/*
  Warnings:

  - The `profile` column on the `provider` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "provider" DROP COLUMN "profile";
ALTER TABLE "provider" ADD COLUMN     "profile" JSONB;
