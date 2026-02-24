CREATE TABLE IF NOT EXISTS "branch_change_requests" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" text NOT NULL,
	"user_id" text NOT NULL,
	"from_partner_id" text,
	"to_partner_id" text NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "member_monthly_status" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" text NOT NULL,
	"partner_id" text NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"marked_by" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_page_settings" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" text NOT NULL,
	"hero_image_url" text,
	"hero_tagline" text,
	"about_title" text,
	"about_text" text,
	"mission_statement" text,
	"logo_url" text,
	"accent_color" text,
	"founder_name" text,
	"founder_title" text,
	"founder_image_url" text,
	"founder_bio" text,
	"gallery_images" jsonb DEFAULT '[]'::jsonb,
	"features" jsonb DEFAULT '[]'::jsonb,
	"social_links" jsonb DEFAULT '{}'::jsonb,
	"show_stats" boolean DEFAULT true NOT NULL,
	"show_courses" boolean DEFAULT true NOT NULL,
	"show_schedule" boolean DEFAULT true NOT NULL,
	"show_gallery" boolean DEFAULT true NOT NULL,
	"show_founder" boolean DEFAULT true NOT NULL,
	"cta_text" text,
	"cta_link" text,
	"year_established" integer,
	"announcement" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "partner_page_settings_partner_id_unique" UNIQUE("partner_id")
);
--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "partner_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_change_requests" ADD CONSTRAINT "branch_change_requests_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_change_requests" ADD CONSTRAINT "branch_change_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_change_requests" ADD CONSTRAINT "branch_change_requests_from_partner_id_partners_id_fk" FOREIGN KEY ("from_partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_change_requests" ADD CONSTRAINT "branch_change_requests_to_partner_id_partners_id_fk" FOREIGN KEY ("to_partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_monthly_status" ADD CONSTRAINT "member_monthly_status_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "member_monthly_status" ADD CONSTRAINT "member_monthly_status_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partner_page_settings" ADD CONSTRAINT "partner_page_settings_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "member_month_year_idx" ON "member_monthly_status" USING btree ("member_id","month","year");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "registrations" ADD CONSTRAINT "registrations_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
