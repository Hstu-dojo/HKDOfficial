import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { classTypeEnum, beltRankEnum, attendanceStatusEnum } from "../enums";
import { user } from "../auth";
import { members } from "./members";

// Classes table
export const classes = pgTable("classes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  classType: classTypeEnum("class_type").notNull(),
  coachId: text("coach_id").notNull().references(() => user.id),
  daysOfWeek: integer("days_of_week").array().notNull(), // Array of 0-6 (Sunday-Saturday)
  startTime: text("start_time").notNull(), // HH:MM format
  endTime: text("end_time").notNull(),
  maxCapacity: integer("max_capacity").notNull().default(20),
  beltLevel: beltRankEnum("belt_level"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Class enrollments
export const enrollments = pgTable("enrollments", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
});

// Attendance tracking
export const attendance = pgTable("attendance", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  classId: text("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  date: timestamp("date", { withTimezone: true }).notNull(),
  status: attendanceStatusEnum("status").notNull().default('present'),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Belt progression history
export const beltProgressions = pgTable("belt_progressions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  fromBelt: beltRankEnum("from_belt").notNull(),
  toBelt: beltRankEnum("to_belt").notNull(),
  testDate: timestamp("test_date", { withTimezone: true }).notNull(),
  awardedBy: text("awarded_by").notNull().references(() => user.id), // coach or admin
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type Class = typeof classes.$inferSelect;
export type NewClass = typeof classes.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
export type BeltProgression = typeof beltProgressions.$inferSelect;
export type NewBeltProgression = typeof beltProgressions.$inferInsert;