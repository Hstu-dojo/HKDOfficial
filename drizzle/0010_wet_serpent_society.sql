ALTER TABLE "member_monthly_status" RENAME TO "profile_monthly_status";--> statement-breakpoint
ALTER TABLE "members" RENAME TO "profiles";--> statement-breakpoint
ALTER TABLE "branch_change_requests" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "profile_monthly_status" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "attendance" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "belt_progressions" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "enrollments" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "equipment_checkouts" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "course_enrollments" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "enrollment_applications" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "monthly_fees" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "payment_reminders" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "bills" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "payments" RENAME COLUMN "member_id" TO "profile_id";--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "members_member_number_unique";--> statement-breakpoint
ALTER TABLE "branch_change_requests" DROP CONSTRAINT "branch_change_requests_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "branch_change_requests" DROP CONSTRAINT "branch_change_requests_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_monthly_status" DROP CONSTRAINT "member_monthly_status_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_monthly_status" DROP CONSTRAINT "member_monthly_status_partner_id_partners_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "members_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" DROP CONSTRAINT "members_partner_id_partners_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT "attendance_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "belt_progressions" DROP CONSTRAINT "belt_progressions_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "equipment_checkouts" DROP CONSTRAINT "equipment_checkouts_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "course_enrollments" DROP CONSTRAINT "course_enrollments_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "enrollment_applications" DROP CONSTRAINT "enrollment_applications_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "monthly_fees" DROP CONSTRAINT "monthly_fees_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP CONSTRAINT "payment_reminders_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "bills" DROP CONSTRAINT "bills_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT "payments_member_id_members_id_fk";
--> statement-breakpoint
DROP INDEX IF EXISTS "member_month_year_idx";--> statement-breakpoint
ALTER TABLE "branch_change_requests" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "email" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "state" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "postal_code" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "identity_type" "identity_type";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "identity_number" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "identity_image" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "institute" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "faculty" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "session" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "height" real;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "weight" real;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "signature_image" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "created_by" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_change_requests" ADD CONSTRAINT "branch_change_requests_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "branch_change_requests" ADD CONSTRAINT "branch_change_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_monthly_status" ADD CONSTRAINT "profile_monthly_status_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profile_monthly_status" ADD CONSTRAINT "profile_monthly_status_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "attendance" ADD CONSTRAINT "attendance_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "belt_progressions" ADD CONSTRAINT "belt_progressions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "equipment_checkouts" ADD CONSTRAINT "equipment_checkouts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monthly_fees" ADD CONSTRAINT "monthly_fees_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bills" ADD CONSTRAINT "bills_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payments" ADD CONSTRAINT "payments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "profile_month_year_idx" ON "profile_monthly_status" USING btree ("profile_id","month","year");--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_member_number_unique" UNIQUE("member_number");