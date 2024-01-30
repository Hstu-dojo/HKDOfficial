-- AlterTable
ALTER TABLE "user" ALTER COLUMN "emailVerified" SET DEFAULT false;
ALTER TABLE "user" ALTER COLUMN "image" SET DEFAULT 'https://api.dicebear.com/7.x/lorelei/svg';

-- CreateIndex
CREATE INDEX "email" ON "user"("email");
