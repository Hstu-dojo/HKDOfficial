import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { beltRankEnum } from "../enums";
import { user } from "../auth";
import { partners } from "../partner";

// Course Packages - defines different karate training packages
export const courses = pgTable("courses", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Beginner Karate", "Advanced Black Belt Training"
  nameBangla: text("name_bangla"), // Bengali name
  description: text("description"),
  descriptionBangla: text("description_bangla"),
  
  // Course Details
  duration: integer("duration").notNull(), // Duration in months
  sessionsPerWeek: integer("sessions_per_week").notNull().default(3),
  sessionDurationMinutes: integer("session_duration_minutes").notNull().default(90),
  
  // Belt requirements
  minimumBelt: beltRankEnum("minimum_belt").default('white'),
  targetBelt: beltRankEnum("target_belt"), // Belt student can achieve after course
  
  // Pricing
  admissionFee: integer("admission_fee").notNull().default(0), // One-time fee in BDT (cents)
  monthlyFee: integer("monthly_fee").notNull(), // Monthly fee in BDT (cents)
  currency: text("currency").notNull().default('BDT'),
  
  // Capacity
  maxStudents: integer("max_students").default(30),
  currentStudents: integer("current_students").default(0),
  
  // Features included
  features: jsonb("features").$type<string[]>(), // e.g., ["Uniform included", "Belt test fee included"]
  
  // Partner/Venue - if set, course is exclusive to that partner
  partnerId: text("partner_id").references(() => partners.id, { onDelete: 'set null' }),
  
  // Media
  thumbnailUrl: text("thumbnail_url"),
  bannerUrl: text("banner_url"),
  
  // Payment info
  bkashNumber: text("bkash_number"), // bKash number for payment
  bkashQrCodeUrl: text("bkash_qr_code_url"), // QR code image URL
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isEnrollmentOpen: boolean("is_enrollment_open").notNull().default(true),
  
  // Creator
  createdBy: text("created_by").references(() => user.id),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Course Schedules - defines when classes are held for each course
export const courseSchedules = pgTable("course_schedules", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  
  // Schedule details
  dayOfWeek: integer("day_of_week").notNull(), // 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(), // HH:MM format
  
  // Location
  location: text("location").notNull().default('Main Dojo'),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Course Instructors - assigns instructors to courses
export const courseInstructors = pgTable("course_instructors", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: text("course_id").notNull().references(() => courses.id, { onDelete: 'cascade' }),
  instructorId: text("instructor_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  isPrimary: boolean("is_primary").notNull().default(false), // Primary instructor
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseSchedule = typeof courseSchedules.$inferSelect;
export type NewCourseSchedule = typeof courseSchedules.$inferInsert;
export type CourseInstructor = typeof courseInstructors.$inferSelect;
export type NewCourseInstructor = typeof courseInstructors.$inferInsert;
