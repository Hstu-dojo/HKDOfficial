CREATE TABLE IF NOT EXISTS "competition_results" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" text NOT NULL,
	"event_name" text NOT NULL,
	"event_date" date NOT NULL,
	"category" text NOT NULL,
	"placement" integer NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE restrict ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competition_results" ADD CONSTRAINT "competition_results_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "competition_result_entry_unique" ON "competition_results" USING btree ("profile_id","event_name","event_date","category");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "competition_results_published_date_idx" ON "competition_results" USING btree ("is_published","event_date");
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "competition_results" ADD CONSTRAINT "competition_result_placement_check" CHECK ("placement" BETWEEN 1 AND 128);
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
