/*
  Warnings:

  - Added the required column `address` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `age` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bloodGroup` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dob` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `father_name` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `height` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identity_number` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `identity_type` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `institute` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name_bangla` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `occupation` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postalCode` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `sex` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `signature_image` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `account` table without a default value. This is not possible if the table is not empty.
  - Added the required column `weight` to the `account` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `account` required. This step will fail if there are existing NULL values in that column.
  - Made the column `image` on table `account` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('NID', 'BIRTH_CERTIFICATE', 'PASSPORT', 'DRIVING_LICENSE');

-- AlterTable
ALTER TABLE "account" ADD COLUMN     "address" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "age" INT4 NOT NULL;
ALTER TABLE "account" ADD COLUMN     "bio" STRING;
ALTER TABLE "account" ADD COLUMN     "bloodGroup" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "city" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "country" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "account" ADD COLUMN     "department" STRING;
ALTER TABLE "account" ADD COLUMN     "dob" TIMESTAMP(3) NOT NULL;
ALTER TABLE "account" ADD COLUMN     "faculty" STRING;
ALTER TABLE "account" ADD COLUMN     "father_name" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "height" FLOAT8 NOT NULL;
ALTER TABLE "account" ADD COLUMN     "identity_image" STRING;
ALTER TABLE "account" ADD COLUMN     "identity_number" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "identity_type" "IdentityType" NOT NULL;
ALTER TABLE "account" ADD COLUMN     "institute" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "name_bangla" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "occupation" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "phone" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "postalCode" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "session" STRING;
ALTER TABLE "account" ADD COLUMN     "sex" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "signature_image" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "state" STRING NOT NULL;
ALTER TABLE "account" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
ALTER TABLE "account" ADD COLUMN     "weight" FLOAT8 NOT NULL;
ALTER TABLE "account" ALTER COLUMN "name" SET NOT NULL;
ALTER TABLE "account" ALTER COLUMN "image" SET NOT NULL;

-- AlterTable
ALTER TABLE "provider" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "provider" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "role" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "role" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "user" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;
