-- Migration: Evolve members → profiles as first-class partner-owned entity
-- This renames tables, columns, and adds new fields to support profiles without linked accounts

--> statement-breakpoint

-- 1. Rename members table to profiles
ALTER TABLE "members" RENAME TO "profiles";

--> statement-breakpoint

-- 2. Rename member_monthly_status table to profile_monthly_status
ALTER TABLE "member_monthly_status" RENAME TO "profile_monthly_status";

--> statement-breakpoint

-- 3. Make user_id nullable on profiles (was NOT NULL)
ALTER TABLE "profiles" ALTER COLUMN "user_id" DROP NOT NULL;

--> statement-breakpoint

-- 4. Drop old FK constraint on user_id (ON DELETE CASCADE) and re-add with SET NULL
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "members_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

--> statement-breakpoint

-- 5. Add new columns to profiles (merged from account + extra fields)
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "email" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "city" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "state" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "country" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "postal_code" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "identity_type" "identity_type";
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "identity_number" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "identity_image" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "institute" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "faculty" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "department" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "session" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "height" real;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "weight" real;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "signature_image" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "created_by" text;
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE SET NULL;

--> statement-breakpoint

-- 6. Rename member_id → profile_id in profile_monthly_status
ALTER TABLE "profile_monthly_status" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
-- Update the FK constraint name
ALTER TABLE "profile_monthly_status" DROP CONSTRAINT IF EXISTS "member_monthly_status_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_monthly_status" ADD CONSTRAINT "profile_monthly_status_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;
--> statement-breakpoint
-- Rename the unique index
DROP INDEX IF EXISTS "member_month_year_idx";
--> statement-breakpoint
CREATE UNIQUE INDEX "profile_month_year_idx" ON "profile_monthly_status" ("profile_id", "month", "year");

--> statement-breakpoint

-- 7. Rename member_id → profile_id in branch_change_requests
ALTER TABLE "branch_change_requests" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "branch_change_requests" DROP CONSTRAINT IF EXISTS "branch_change_requests_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "branch_change_requests" ADD CONSTRAINT "branch_change_requests_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;
--> statement-breakpoint
-- Make user_id nullable in branch_change_requests
ALTER TABLE "branch_change_requests" ALTER COLUMN "user_id" DROP NOT NULL;
--> statement-breakpoint
-- Update user_id FK to SET NULL
ALTER TABLE "branch_change_requests" DROP CONSTRAINT IF EXISTS "branch_change_requests_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "branch_change_requests" ADD CONSTRAINT "branch_change_requests_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL;

--> statement-breakpoint

-- 8. Rename member_id → profile_id in enrollments (class enrollments)
ALTER TABLE "enrollments" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "enrollments_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

--> statement-breakpoint

-- 9. Rename member_id → profile_id in attendance
ALTER TABLE "attendance" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "attendance_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

--> statement-breakpoint

-- 10. Rename member_id → profile_id in belt_progressions
ALTER TABLE "belt_progressions" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "belt_progressions" DROP CONSTRAINT IF EXISTS "belt_progressions_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "belt_progressions" ADD CONSTRAINT "belt_progressions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

--> statement-breakpoint

-- 11. Rename member_id → profile_id in equipment_checkouts
ALTER TABLE "equipment_checkouts" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "equipment_checkouts" DROP CONSTRAINT IF EXISTS "equipment_checkouts_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "equipment_checkouts" ADD CONSTRAINT "equipment_checkouts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

--> statement-breakpoint

-- 12. Rename member_id → profile_id in enrollment_applications
ALTER TABLE "enrollment_applications" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "enrollment_applications" DROP CONSTRAINT IF EXISTS "enrollment_applications_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "enrollment_applications" ADD CONSTRAINT "enrollment_applications_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id");

--> statement-breakpoint

-- 13. Rename member_id → profile_id in course_enrollments
ALTER TABLE "course_enrollments" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "course_enrollments" DROP CONSTRAINT IF EXISTS "course_enrollments_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

--> statement-breakpoint

-- 14. Rename member_id → profile_id in monthly_fees
ALTER TABLE "monthly_fees" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "monthly_fees" DROP CONSTRAINT IF EXISTS "monthly_fees_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "monthly_fees" ADD CONSTRAINT "monthly_fees_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

--> statement-breakpoint

-- 15. Rename member_id → profile_id in payment_reminders
ALTER TABLE "payment_reminders" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "payment_reminders" DROP CONSTRAINT IF EXISTS "payment_reminders_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

--> statement-breakpoint

-- 16. Rename member_id → profile_id in bills
ALTER TABLE "bills" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "bills" DROP CONSTRAINT IF EXISTS "bills_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "bills" ADD CONSTRAINT "bills_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

--> statement-breakpoint

-- 17. Rename member_id → profile_id in payments
ALTER TABLE "payments" RENAME COLUMN "member_id" TO "profile_id";
--> statement-breakpoint
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_member_id_members_id_fk";
--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE;

--> statement-breakpoint

-- 18. Update FK constraint name for partner_id on profiles (table was renamed)
ALTER TABLE "profiles" DROP CONSTRAINT IF EXISTS "members_partner_id_partners_id_fk";
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL;

--> statement-breakpoint

-- 19. Update remaining FK constraint names on profile_monthly_status (table was renamed)
ALTER TABLE "profile_monthly_status" DROP CONSTRAINT IF EXISTS "member_monthly_status_partner_id_partners_id_fk";
--> statement-breakpoint
ALTER TABLE "profile_monthly_status" ADD CONSTRAINT "profile_monthly_status_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE CASCADE;
