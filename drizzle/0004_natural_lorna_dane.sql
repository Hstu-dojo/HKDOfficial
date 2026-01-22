DO $$ BEGIN
 CREATE TYPE "public"."program_type" AS ENUM('BELT_TEST', 'COMPETITION', 'SEMINAR', 'WORKSHOP', 'SPECIAL_TRAINING', 'OTHER');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'PROGRAM';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'PROGRAM_REGISTRATION';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_registrations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" text NOT NULL,
	"user_id" text NOT NULL,
	"registration_number" text,
	"fee_amount" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"payment_method" text DEFAULT 'bkash',
	"transaction_id" text,
	"payment_proof_url" text,
	"payment_submitted_at" timestamp with time zone,
	"status" "enrollment_application_status" DEFAULT 'pending_payment' NOT NULL,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"rejection_reason" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_registrations_registration_number_unique" UNIQUE("registration_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "programs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"type" "program_type" DEFAULT 'OTHER' NOT NULL,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"location" text,
	"registration_deadline" timestamp with time zone,
	"max_participants" integer,
	"current_participants" integer DEFAULT 0,
	"fee" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"requirements" jsonb,
	"banner_url" text,
	"thumbnail_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_registration_open" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programs_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_registrations" ADD CONSTRAINT "program_registrations_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_registrations" ADD CONSTRAINT "program_registrations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_registrations" ADD CONSTRAINT "program_registrations_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
