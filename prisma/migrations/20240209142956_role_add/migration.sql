/*
  Warnings:

  - The values [HR,EMPLOYEE,GUEST] on the enum `Roletype` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[levelId]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId]` on the table `role` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `role` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TABLE "role" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "Roletype" ADD VALUE 'MODERATOR';
ALTER TYPE "Roletype" ADD VALUE 'INSTRUCTOR';
ALTER TYPE "Roletype" ADD VALUE 'MEMBER';
ALTER TYPE "Roletype"DROP VALUE 'HR';
ALTER TYPE "Roletype"DROP VALUE 'EMPLOYEE';
ALTER TYPE "Roletype"DROP VALUE 'GUEST';

-- DropForeignKey
ALTER TABLE "role" DROP CONSTRAINT "role_id_fkey";

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "userId" STRING NOT NULL;
ALTER TABLE "role" ALTER COLUMN "role" SET DEFAULT 'MEMBER';
ALTER TABLE "role" ALTER COLUMN "levelId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "Roletype" NOT NULL DEFAULT 'MEMBER';

-- CreateIndex
CREATE UNIQUE INDEX "role_levelId_key" ON "role"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "role_userId_key" ON "role"("userId");
