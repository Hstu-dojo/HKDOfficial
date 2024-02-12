/*
  Warnings:

  - A unique constraint covering the columns `[userId,provider]` on the table `provider` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `provider` on the `provider` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ProviderType" AS ENUM ('Google', 'GitHub');

-- DropIndex
DROP INDEX "provider_provider_providerAccountId_key";

-- AlterTable
ALTER TABLE "provider" ADD COLUMN     "profile" STRING;
ALTER TABLE "provider" DROP COLUMN "provider";
ALTER TABLE "provider" ADD COLUMN     "provider" "ProviderType" NOT NULL;
ALTER TABLE "provider" ALTER COLUMN "providerAccountId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "provider_userId_provider_key" ON "provider"("userId", "provider");
