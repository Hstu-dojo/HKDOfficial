CREATE TABLE IF NOT EXISTS "billing_mail_deliveries" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_key" text NOT NULL,
	"scope_key" text NOT NULL,
	"partner_id" text,
	"profile_id" text NOT NULL,
	"billing_month" text NOT NULL,
	"recipient_email" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"fee_ids" jsonb NOT NULL,
	"actor" text NOT NULL,
	"message_id" text,
	"error_message" text,
	"claimed_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_fee_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monthly_fee_id" text NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"previous" jsonb NOT NULL,
	"next" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "partner_bill_events" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" text NOT NULL,
	"actor" text NOT NULL,
	"action" text NOT NULL,
	"previous" jsonb NOT NULL,
	"next" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP INDEX IF EXISTS "profile_month_year_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing_mail_deliveries" ADD CONSTRAINT "billing_mail_deliveries_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "billing_mail_deliveries" ADD CONSTRAINT "billing_mail_deliveries_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monthly_fee_events" ADD CONSTRAINT "monthly_fee_events_monthly_fee_id_monthly_fees_id_fk" FOREIGN KEY ("monthly_fee_id") REFERENCES "public"."monthly_fees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "partner_bill_events" ADD CONSTRAINT "partner_bill_events_bill_id_partner_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."partner_bills"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "billing_mail_campaign_recipient_idx" ON "billing_mail_deliveries" USING btree ("campaign_key","scope_key","profile_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "billing_mail_queue_idx" ON "billing_mail_deliveries" USING btree ("campaign_key","scope_key","status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "monthly_fee_events_fee_idx" ON "monthly_fee_events" USING btree ("monthly_fee_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_bill_events_bill_idx" ON "partner_bill_events" USING btree ("bill_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "monthly_fees_enrollment_period_idx" ON "monthly_fees" USING btree ("enrollment_id","billing_month");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profile_month_year_idx" ON "profile_monthly_status" USING btree ("profile_id","partner_id","month","year");