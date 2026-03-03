-- Migration: Allow manual certificates without a linked profile
-- 1. Make profile_id nullable
ALTER TABLE "program_certificates" ALTER COLUMN "profile_id" DROP NOT NULL;

-- 2. Add participant_name column for manual entries
ALTER TABLE "program_certificates" ADD COLUMN IF NOT EXISTS "participant_name" text;

-- 3. Drop old unique constraint and recreate with NULLS NOT DISTINCT
-- (allows multiple manual certs per program but prevents duplicate profile+program)
ALTER TABLE "program_certificates" DROP CONSTRAINT IF EXISTS "program_certificates_profile_id_program_id_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "program_certificates_profile_program_unique"
  ON "program_certificates" ("profile_id", "program_id")
  WHERE "profile_id" IS NOT NULL;
