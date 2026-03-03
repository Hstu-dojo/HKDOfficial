DO $$ BEGIN
 CREATE TYPE "public"."certificate_status" AS ENUM('ELIGIBLE', 'ISSUED', 'REVOKED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."signature_role" AS ENUM('TRAINER', 'COORDINATOR');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "action" ADD VALUE 'ACCESS';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'ADMIN_PANEL';--> statement-breakpoint
ALTER TYPE "roletype" ADD VALUE 'SUPER_ADMIN';--> statement-breakpoint
ALTER TYPE "roletype" ADD VALUE 'STUDENT';--> statement-breakpoint
ALTER TYPE "roletype" ADD VALUE 'USER';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "certificate_signatures" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_bangla" text,
	"role" "signature_role" NOT NULL,
	"title" text,
	"signature_image_url" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_certificates" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"certificate_number" text NOT NULL,
	"status" "certificate_status" DEFAULT 'ELIGIBLE' NOT NULL,
	"issue_date" timestamp with time zone,
	"trainer_signature_id" text,
	"coordinator_signature_id" text,
	"issued_by" text,
	"issued_at" timestamp with time zone,
	"revoked_by" text,
	"revoked_at" timestamp with time zone,
	"revoke_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_certificates_certificate_number_unique" UNIQUE("certificate_number")
);
--> statement-breakpoint
ALTER TABLE "program_registrations" ADD COLUMN "profile_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "certificate_signatures" ADD CONSTRAINT "certificate_signatures_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_certificates" ADD CONSTRAINT "program_certificates_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_certificates" ADD CONSTRAINT "program_certificates_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_certificates" ADD CONSTRAINT "program_certificates_trainer_signature_id_certificate_signatures_id_fk" FOREIGN KEY ("trainer_signature_id") REFERENCES "public"."certificate_signatures"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_certificates" ADD CONSTRAINT "program_certificates_coordinator_signature_id_certificate_signatures_id_fk" FOREIGN KEY ("coordinator_signature_id") REFERENCES "public"."certificate_signatures"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_certificates" ADD CONSTRAINT "program_certificates_issued_by_user_id_fk" FOREIGN KEY ("issued_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_certificates" ADD CONSTRAINT "program_certificates_revoked_by_user_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_registrations" ADD CONSTRAINT "program_registrations_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
