ALTER TABLE "programs" ADD COLUMN IF NOT EXISTS "course_id" text;
--> statement-breakpoint
ALTER TABLE "program_registrations" ADD COLUMN IF NOT EXISTS "new_rank" "belt_rank";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "programs" ADD CONSTRAINT "programs_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
