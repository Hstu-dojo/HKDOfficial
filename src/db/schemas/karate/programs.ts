import { pgTable, text, integer, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth";
import { enrollmentApplicationStatusEnum } from "./enrollments";

// Program Type Enum
export const programTypeEnum = pgEnum('program_type', [
  'BELT_TEST',
  'COMPETITION',
  'SEMINAR',
  'WORKSHOP',
  'SPECIAL_TRAINING',
  'OTHER'
]);

// Programs Table - Defines one-time fee events/programs
export const programs = pgTable("programs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(), // URL friendly slug
  description: text("description"),
  type: programTypeEnum("type").notNull().default('OTHER'),
  
  // Schedule
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  location: text("location"),
  
  // Registration
  registrationDeadline: timestamp("registration_deadline", { withTimezone: true }),
  maxParticipants: integer("max_participants"),
  currentParticipants: integer("current_participants").default(0),
  
  // Fees
  fee: integer("fee").notNull().default(0), // Fee in cents/paisa (or main currency unit depending on standard)
  currency: text("currency").notNull().default('BDT'),
  
  // Requirements
  requirements: jsonb("requirements").$type<string[]>(), // e.g. ["Must be Yellow Belt", "Age > 12"]
  
  // Media
  bannerUrl: text("banner_url"),
  thumbnailUrl: text("thumbnail_url"),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isRegistrationOpen: boolean("is_registration_open").notNull().default(true),
  
  createdBy: text("created_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Program Registrations - Tracks user registration & payment for programs
export const programRegistrations = pgTable("program_registrations", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: text("program_id").notNull().references(() => programs.id, { onDelete: 'cascade' }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  
  // Registration data
  registrationNumber: text("registration_number").unique(), // e.g. "PROG-2026-001"
  
  // Payment Info
  feeAmount: integer("fee_amount").notNull(),
  currency: text("currency").notNull().default('BDT'),
  
  paymentMethod: text("payment_method").default('bkash'),
  transactionId: text("transaction_id"),
  paymentProofUrl: text("payment_proof_url"),
  paymentSubmittedAt: timestamp("payment_submitted_at", { withTimezone: true }),
  
  // Status (reusing enrollment status for consistency)
  status: enrollmentApplicationStatusEnum("status").notNull().default('pending_payment'),
  
  // Verification/Approval
  verifiedBy: text("verified_by").references(() => user.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  notes: text("notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Ensure one registration per user per program (unless failed/rejected, but usually we want unique active ones)
  // For simplicity, let's enforce unique pair for now. If they fail, they might need to update the existing one or delete it.
  uniqueUserProgram: sql`unique(${table.userId}, ${table.programId})`,
}));

// Export Types
export type Program = typeof programs.$inferSelect;
export type NewProgram = typeof programs.$inferInsert;
export type ProgramRegistration = typeof programRegistrations.$inferSelect;
export type NewProgramRegistration = typeof programRegistrations.$inferInsert;
