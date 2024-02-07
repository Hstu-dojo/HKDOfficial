/*
  Warnings:

  - Added the required column `userAvatar` to the `user` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userName` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- AlterSequence
ALTER SEQUENCE "account_id_seq" MAXVALUE 9223372036854775807;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "userAvatar" STRING NOT NULL;
ALTER TABLE "user" ADD COLUMN     "userName" STRING NOT NULL;
