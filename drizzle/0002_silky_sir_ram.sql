DO $$ BEGIN
 CREATE TYPE "public"."enrollment_application_status" AS ENUM('pending_payment', 'payment_submitted', 'payment_verified', 'approved', 'rejected', 'cancelled');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."monthly_fee_status" AS ENUM('pending', 'due', 'payment_submitted', 'paid', 'overdue', 'waived', 'partial');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TYPE "action" ADD VALUE 'APPROVE';--> statement-breakpoint
ALTER TYPE "action" ADD VALUE 'VERIFY';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'GALLERY';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'EVENT';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'ANNOUNCEMENT';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'CERTIFICATE';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'REPORT';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'ENROLLMENT';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'MONTHLY_FEE';--> statement-breakpoint
ALTER TYPE "resource_type" ADD VALUE 'SCHEDULE';--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_instructors" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" text NOT NULL,
	"instructor_id" text NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_schedules" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" text NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"location" text DEFAULT 'Main Dojo' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "courses" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_bangla" text,
	"description" text,
	"description_bangla" text,
	"duration" integer NOT NULL,
	"sessions_per_week" integer DEFAULT 3 NOT NULL,
	"session_duration_minutes" integer DEFAULT 90 NOT NULL,
	"minimum_belt" "belt_rank" DEFAULT 'white',
	"target_belt" "belt_rank",
	"admission_fee" integer DEFAULT 0 NOT NULL,
	"monthly_fee" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"max_students" integer DEFAULT 30,
	"current_students" integer DEFAULT 0,
	"features" jsonb,
	"thumbnail_url" text,
	"banner_url" text,
	"bkash_number" text,
	"bkash_qr_code_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_enrollment_open" boolean DEFAULT true NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "course_enrollments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" text NOT NULL,
	"member_id" text NOT NULL,
	"application_id" text,
	"enrolled_at" timestamp with time zone DEFAULT now() NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"expected_end_date" timestamp with time zone,
	"monthly_fee" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"completed_at" timestamp with time zone,
	"dropped_at" timestamp with time zone,
	"drop_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "enrollment_applications" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_number" text NOT NULL,
	"user_id" text NOT NULL,
	"course_id" text NOT NULL,
	"student_info" jsonb NOT NULL,
	"admission_fee_amount" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"payment_method" text DEFAULT 'bkash',
	"transaction_id" text,
	"payment_proof_url" text,
	"payment_submitted_at" timestamp with time zone,
	"status" "enrollment_application_status" DEFAULT 'pending_payment' NOT NULL,
	"payment_verified_by" text,
	"payment_verified_at" timestamp with time zone,
	"payment_verification_notes" text,
	"reviewed_by" text,
	"reviewed_at" timestamp with time zone,
	"review_notes" text,
	"rejection_reason" text,
	"member_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_applications_application_number_unique" UNIQUE("application_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monthly_fees" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" text NOT NULL,
	"member_id" text NOT NULL,
	"billing_month" text NOT NULL,
	"billing_year" integer NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'BDT' NOT NULL,
	"amount_paid" integer DEFAULT 0,
	"due_date" timestamp with time zone NOT NULL,
	"status" "monthly_fee_status" DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"transaction_id" text,
	"payment_proof_url" text,
	"payment_submitted_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"verified_by" text,
	"verified_at" timestamp with time zone,
	"verification_notes" text,
	"waived_by" text,
	"waived_at" timestamp with time zone,
	"waiver_reason" text,
	"reminders_sent" integer DEFAULT 0,
	"last_reminder_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_reminders" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"monthly_fee_id" text NOT NULL,
	"member_id" text NOT NULL,
	"reminder_type" text NOT NULL,
	"recipient_email" text,
	"recipient_phone" text,
	"subject" text,
	"message" text,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	"delivery_status" text DEFAULT 'sent',
	"error_message" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "payment_settings" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"value_type" text DEFAULT 'string' NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "payment_settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_instructors" ADD CONSTRAINT "course_instructors_instructor_id_user_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_schedules" ADD CONSTRAINT "course_schedules_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "courses" ADD CONSTRAINT "courses_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_application_id_enrollment_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."enrollment_applications"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_payment_verified_by_user_id_fk" FOREIGN KEY ("payment_verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monthly_fees" ADD CONSTRAINT "monthly_fees_enrollment_id_course_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."course_enrollments"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monthly_fees" ADD CONSTRAINT "monthly_fees_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monthly_fees" ADD CONSTRAINT "monthly_fees_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "monthly_fees" ADD CONSTRAINT "monthly_fees_waived_by_user_id_fk" FOREIGN KEY ("waived_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_monthly_fee_id_monthly_fees_id_fk" FOREIGN KEY ("monthly_fee_id") REFERENCES "public"."monthly_fees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_settings" ADD CONSTRAINT "payment_settings_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
