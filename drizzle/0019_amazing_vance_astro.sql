ALTER TYPE "belt_rank" ADD VALUE IF NOT EXISTS 'black';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "program_types" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" "program_type" DEFAULT 'OTHER' NOT NULL,
	"certificate_pdf_path" text NOT NULL,
	"field_mappings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_admin_sessions" (
	"token" text PRIMARY KEY NOT NULL,
	"partner_admin_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_admins" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "program_registrations" ADD COLUMN IF NOT EXISTS "new_rank" "belt_rank";--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "program_type_id" text;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "course_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "program_types" ADD CONSTRAINT "program_types_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partner_admin_sessions" ADD CONSTRAINT "partner_admin_sessions_partner_admin_id_partner_admins_id_fk" FOREIGN KEY ("partner_admin_id") REFERENCES "public"."partner_admins"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partner_admins" ADD CONSTRAINT "partner_admins_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_program_type_id_program_types_id_fk" FOREIGN KEY ("program_type_id") REFERENCES "public"."program_types"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
