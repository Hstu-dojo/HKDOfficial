import { pgTable, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
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

// Partner Page Settings table - customizable homepage content for /org/[slug]
export const partnerPageSettings = pgTable("partner_page_settings", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  partnerId: text("partner_id").notNull().references(() => partners.id, { onDelete: 'cascade' }).unique(),

  // Hero section
  heroImageUrl: text("hero_image_url"),
  heroTagline: text("hero_tagline"),           // Short subtitle e.g. "Train with the best since 2005"

  // About section
  aboutTitle: text("about_title"),
  aboutText: text("about_text"),               // Longer about paragraph
  missionStatement: text("mission_statement"),

  // Branding
  logoUrl: text("logo_url"),
  accentColor: text("accent_color"),           // Hex colour e.g. "#e11d48"

  // Founder / head instructor spotlight
  founderName: text("founder_name"),
  founderTitle: text("founder_title"),         // e.g. "Head Instructor, 5th Dan"
  founderImageUrl: text("founder_image_url"),
  founderBio: text("founder_bio"),

  // Gallery images  – JSONB array of strings (URLs)
  galleryImages: jsonb("gallery_images").$type<string[]>().default([]),

  // Feature highlights – JSONB array of { icon, title, description }
  features: jsonb("features").$type<{ icon: string; title: string; description: string }[]>().default([]),

  // Social links – JSONB { facebook?, instagram?, youtube?, twitter?, website? }
  socialLinks: jsonb("social_links").$type<Record<string, string>>().default({}),

  // Section visibility toggles
  showStats: boolean("show_stats").notNull().default(true),
  showCourses: boolean("show_courses").notNull().default(true),
  showSchedule: boolean("show_schedule").notNull().default(true),
  showGallery: boolean("show_gallery").notNull().default(true),
  showFounder: boolean("show_founder").notNull().default(true),

  // Call-to-action
  ctaText: text("cta_text"),                   // e.g. "Start Your Journey Today"
  ctaLink: text("cta_link"),                   // e.g. "/register"

  // Misc
  yearEstablished: integer("year_established"),
  announcement: text("announcement"),          // Optional banner text
  defaultScheduleDay: integer("default_schedule_day"), // 0-6 (Sun-Sat), which day tab opens by default

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;
export type PartnerBill = typeof partnerBills.$inferSelect;
export type NewPartnerBill = typeof partnerBills.$inferInsert;
export type PartnerPageSettings = typeof partnerPageSettings.$inferSelect;
export type NewPartnerPageSettings = typeof partnerPageSettings.$inferInsert;
