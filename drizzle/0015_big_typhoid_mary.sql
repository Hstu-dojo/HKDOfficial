DO $$ BEGIN
 CREATE TYPE "public"."student_level" AS ENUM('student_9th_kyu', 'student_8th_kyu', 'student_7th_kyu', 'student_6th_kyu', 'student_5th_kyu', 'student_4th_kyu', 'student_3rd_kyu', 'student_2nd_kyu', 'student_1st_kyu', 'black_belt');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "student_level" "student_level";