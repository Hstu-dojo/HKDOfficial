ALTER TABLE "program_certificates" ALTER COLUMN "profile_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "program_certificates" ADD COLUMN "participant_name" text;