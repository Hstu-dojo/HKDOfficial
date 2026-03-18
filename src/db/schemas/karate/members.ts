import { pgTable, text, boolean, timestamp, integer, uniqueIndex, real } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { beltRankEnum, registrationStatusEnum, identityTypeEnum, studentLevelEnum } from "../enums";
import { user } from "../auth";
import { partners } from "../partner";

// Profiles table - partner-owned member profiles (first-class entity)
// A profile can exist without a linked user account (partner-admin created)
export const profiles = pgTable("profiles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").references(() => user.id, { onDelete: 'set null' }), // nullable — can exist without account
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
  email: text("email"),
  presentAddress: text("present_address"),
  permanentAddress: text("permanent_address"),
  city: text("city"),
  state: text("state"),
  country: text("country"),
  postalCode: text("postal_code"),
  
  // Identity Documents
  nid: text("nid"),
  birthCertificateNo: text("birth_certificate_no"),
  passportNo: text("passport_no"),
  identityType: identityTypeEnum("identity_type"),
  identityNumber: text("identity_number"),
  identityImage: text("identity_image"),
  
  // Professional/Educational
  profession: text("profession"),
  educationQualification: text("education_qualification"),
  institute: text("institute"),
  faculty: text("faculty"),
  department: text("department"),
  session: text("session"),
  
  // Physical
  height: real("height"),
  weight: real("weight"),
  
  // Dojo Information
  beltRank: beltRankEnum("belt_rank").notNull().default('white'),
  studentLevel: studentLevelEnum("student_level"),
  picture: text("picture"),
  signatureImage: text("signature_image"),
  
  // Partner/Venue Information (owner)
  partnerId: text("partner_id").references(() => partners.id, { onDelete: 'set null' }),
  
  // Emergency Contact
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  
  // Provenance
  createdBy: text("created_by").references(() => user.id, { onDelete: 'set null' }), // partner-admin or system user who created

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
  partnerId: text("partner_id").references(() => partners.id, { onDelete: 'set null' }),
  status: registrationStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Profile monthly activity status — tracks which months a profile is active (for billing)
export const profileMonthlyStatus = pgTable("profile_monthly_status", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  partnerId: text("partner_id").notNull().references(() => partners.id, { onDelete: 'cascade' }),
  month: integer("month").notNull(),  // 1-12
  year: integer("year").notNull(),    // e.g., 2026
  isActive: boolean("is_active").notNull().default(true),
  markedBy: text("marked_by"),        // partner admin who set the status
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  profileMonthYearIdx: uniqueIndex("profile_month_year_idx").on(table.profileId, table.month, table.year),
}));

// Branch change requests — profile transfer to a different partner/venue
export const branchChangeRequests = pgTable("branch_change_requests", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  profileId: text("profile_id").notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  userId: text("user_id").references(() => user.id, { onDelete: 'set null' }), // nullable — may not have linked user
  fromPartnerId: text("from_partner_id").references(() => partners.id, { onDelete: 'set null' }),
  toPartnerId: text("to_partner_id").notNull().references(() => partners.id, { onDelete: 'cascade' }),
  reason: text("reason"),
  status: text("status").notNull().default('pending'), // pending, approved, rejected
  reviewedBy: text("reviewed_by"),    // partner admin who approved/rejected
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Backward-compatible aliases
export const members = profiles;
export const memberMonthlyStatus = profileMonthlyStatus;

// Type exports
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
export type Member = Profile; // backward compat alias
export type NewMember = NewProfile; // backward compat alias
export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;
export type ProfileMonthlyStatus = typeof profileMonthlyStatus.$inferSelect;
export type NewProfileMonthlyStatus = typeof profileMonthlyStatus.$inferInsert;
export type MemberMonthlyStatus = ProfileMonthlyStatus; // backward compat alias
export type NewMemberMonthlyStatus = NewProfileMonthlyStatus; // backward compat alias
export type BranchChangeRequest = typeof branchChangeRequests.$inferSelect;
export type NewBranchChangeRequest = typeof branchChangeRequests.$inferInsert;