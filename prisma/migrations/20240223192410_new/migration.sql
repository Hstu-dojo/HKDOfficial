/*
  Warnings:

  - A unique constraint covering the columns `[userId,role]` on the table `user-role` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "user-role_userId_role_key" ON "user-role"("userId", "role");
