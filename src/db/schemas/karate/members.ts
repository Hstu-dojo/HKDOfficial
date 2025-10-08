import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { beltRankEnum, registrationStatusEnum } from "../enums";
import { user } from "../auth";

// Members table - detailed member profiles extending user information
export const members = pgTable("members", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  memberNumber: text("member_number").notNull().unique(),
  
  // Personal Information
  fullNameEnglish: text("full_name_english"),
  fullNameBangla: text("full_name_bangla"),
  fatherName: text("father_name"),
  fatherNameBangla: text("father_name_bangla"),
  motherName: text("mother_name"),
  motherNameBangla: text("mother_name_bangla"),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  gender: text("gender"),
  bloodGroup: text("blood_group"),
  religion: text("religion"),
  maritalStatus: text("marital_status"),
  nationality: text("nationality"),
  
  // Contact Information
  phoneNumber: text("phone_number"),
  presentAddress: text("present_address"),
  permanentAddress: text("permanent_address"),
  
  // Identity Documents
  nid: text("nid"),
  birthCertificateNo: text("birth_certificate_no"),
  passportNo: text("passport_no"),
  
  // Professional/Educational
  profession: text("profession"),
  educationQualification: text("education_qualification"),
  
  // Dojo Information
  beltRank: beltRankEnum("belt_rank").notNull().default('white'),
  picture: text("picture"),
  
  // Emergency Contact
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  
  // System fields
  joinDate: timestamp("join_date", { withTimezone: true }).defaultNow(),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  isProfileComplete: boolean("is_profile_complete").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Registration requests
export const registrations = pgTable("registrations", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }).notNull(),
  emergencyContact: text("emergency_contact").notNull(),
  emergencyPhone: text("emergency_phone").notNull(),
  status: registrationStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;