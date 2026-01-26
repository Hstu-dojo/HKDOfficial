ALTER TYPE "resource_type" ADD VALUE 'PARTNER';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'PARTNER_BILL';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_bills" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" text NOT NULL,
	"course_id" text,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"description" text,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paid_at" timestamp with time zone,
	"due_date" timestamp with time zone,
	"generated_by" text,
	"verified_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partners" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"location" text,
	"contact_email" text,
	"contact_phone" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partners_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "partner_id" text;--> statement-breakpoint
ALTER TABLE "courses" ADD COLUMN "partner_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partner_bills" ADD CONSTRAINT "partner_bills_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partner_bills" ADD CONSTRAINT "partner_bills_generated_by_user_id_fk" FOREIGN KEY ("generated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partner_bills" ADD CONSTRAINT "partner_bills_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "members" ADD CONSTRAINT "members_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
