/*
  Warnings:

  - You are about to drop the column `role` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `VerificationToken` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `level` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `role` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
ALTER TYPE "Roletype" ADD VALUE 'GUEST';

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_userId_fkey";

-- DropForeignKey
ALTER TABLE "VerificationToken" DROP CONSTRAINT "VerificationToken_uid_fkey";

-- DropForeignKey
ALTER TABLE "level" DROP CONSTRAINT "level_id_fkey";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "role";
ALTER TABLE "user" ADD COLUMN     "defaultRole" "Roletype" NOT NULL DEFAULT 'GUEST';

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "VerificationToken";

-- DropTable
DROP TABLE "level";

-- DropTable
DROP TABLE "role";

-- CreateTable
CREATE TABLE "session" (
    "id" STRING NOT NULL,
    "sessionToken" STRING NOT NULL,
    "userId" STRING NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user-role" (
    "id" STRING NOT NULL,
    "role" "Roletype" NOT NULL DEFAULT 'GUEST',
    "levelId" STRING,
    "userId" STRING NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user-role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission-group" (
    "id" STRING NOT NULL,
    "levelName" STRING NOT NULL,
    "features" STRING[],

    CONSTRAINT "permission-group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification-token" (
    "id" STRING NOT NULL,
    "uid" STRING NOT NULL,
    "token" STRING NOT NULL,
    "validity" INT4 NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification-token_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "session_userId_key" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user-role_levelId_key" ON "user-role"("levelId");

-- CreateIndex
CREATE UNIQUE INDEX "user-role_userId_key" ON "user-role"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification-token_uid_key" ON "verification-token"("uid");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user-role" ADD CONSTRAINT "user-role_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "permission-group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user-role" ADD CONSTRAINT "user-role_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification-token" ADD CONSTRAINT "verification-token_uid_fkey" FOREIGN KEY ("uid") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
