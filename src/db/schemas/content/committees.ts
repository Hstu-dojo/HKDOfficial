import { pgTable, text, boolean, timestamp, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user, role } from "../auth";
import { profiles } from "../karate/members";
import { certificateSignatures } from "../karate/certificates";

export const committeeStatusEnum = pgEnum("committee_status", ["pending", "approved", "rejected"]);

export const committees = pgTable("committees", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(), // e.g. "Executive Committee 2026-2027"
  year: text("year").notNull(),   // e.g. "2026"
  isActive: boolean("is_active").notNull().default(false),
  description: text("description"),
  trainerSignatureId: text("trainer_signature_id").references(() => certificateSignatures.id, { onDelete: "set null" }),
  coordinatorSignatureId: text("coordinator_signature_id").references(() => certificateSignatures.id, { onDelete: "set null" }),
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const committeeMembers = pgTable("committee_members", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  committeeId: text("committee_id").notNull().references(() => committees.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  profileId: text("profile_id").references(() => profiles.id, { onDelete: "set null" }), // link to existing profile data
  status: committeeStatusEnum("status").notNull().default("pending"),
  positionTitle: text("position_title"), // e.g. "President", "General Secretary"
  rbacRoleId: text("rbac_role_id").references(() => role.id, { onDelete: "set null" }),
  
  // Extra form details not in onboarding profile
  institution: text("institution"),
  department: text("department"),
  statement: text("statement"),
  additionalData: jsonb("additional_data").$type<Record<string, any>>().default(sql`'{}'::jsonb`),
  
  idCardUrl: text("id_card_url"), // Path to generated/uploaded ID card

  approvedBy: text("approved_by").references(() => user.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Committee = typeof committees.$inferSelect;
export type NewCommittee = typeof committees.$inferInsert;
export type CommitteeMember = typeof committeeMembers.$inferSelect;
export type NewCommitteeMember = typeof committeeMembers.$inferInsert;
