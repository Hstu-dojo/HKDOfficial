import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth";

// Partners table - represents partner organizations/venues
export const partners = pgTable("partners", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(), // URL-friendly identifier for public page
  description: text("description"),
  location: text("location"),
  contactEmail: text("contact_email"), // For billing notifications
  contactPhone: text("contact_phone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Partner Bills table - for billing partner organizations
export const partnerBills = pgTable("partner_bills", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: text("partner_id").notNull().references(() => partners.id, { onDelete: 'cascade' }),
  courseId: text("course_id"), // Optional: if bill is for a specific course
  
  // Billing period
  month: integer("month").notNull(), // 1-12
  year: integer("year").notNull(), // e.g., 2024
  
  // Amount
  amount: integer("amount").notNull(), // Amount in cents/paisa
  currency: text("currency").notNull().default('BDT'),
  
  // Status
  status: text("status").notNull().default('pending'), // pending, paid, overdue, cancelled
  
  // Metadata
  description: text("description"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  
  // Admin tracking
  generatedBy: text("generated_by").references(() => user.id),
  verifiedBy: text("verified_by").references(() => user.id),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type PartnerBill = typeof partnerBills.$inferSelect;
export type NewPartnerBill = typeof partnerBills.$inferInsert;
