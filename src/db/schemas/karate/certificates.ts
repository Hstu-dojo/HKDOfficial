import { pgTable, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth";
import { programs } from "./programs";
import { profiles } from "./members";

// Certificate Status Enum
export const certificateStatusEnum = pgEnum("certificate_status", [
  "ELIGIBLE",     // Marked eligible but not yet issued
  "ISSUED",       // Certificate has been generated/issued
  "REVOKED",      // Certificate revoked by admin
]);

// Signature Type Enum
export const signatureRoleEnum = pgEnum("signature_role", [
  "TRAINER",
  "COORDINATOR",
]);

// ---------------------------------------------------------------------------
// Certificate Signatures — reusable signature collection for certificate PDFs
// ---------------------------------------------------------------------------
export const certificateSignatures = pgTable("certificate_signatures", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Signer information
  name: text("name").notNull(),               // Display name on certificate
  nameBangla: text("name_bangla"),            // Bangla name (optional)
  role: signatureRoleEnum("role").notNull(),  // TRAINER or COORDINATOR
  title: text("title"),                       // e.g. "Chief Instructor", "General Secretary"
  
  // Signature image (Cloudinary URL)
  signatureImageUrl: text("signature_image_url").notNull(),
  
  // Metadata
  isActive: boolean("is_active").notNull().default(true),
  
  createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Program Certificates — tracks issued certificates per participant per program
// ---------------------------------------------------------------------------
export const programCertificates = pgTable("program_certificates", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Linked entities
  programId: text("program_id").notNull().references(() => programs.id, { onDelete: "cascade" }),
  profileId: text("profile_id").references(() => profiles.id, { onDelete: "cascade" }), // nullable — manual certs may not have a profile initially
  
  // Manual participant name (used when no profile is linked)
  participantName: text("participant_name"),
  
  // Certificate identification
  certificateNumber: text("certificate_number").notNull().unique(), // e.g. "HKD-CERT-2026-0001"
  
  // Status tracking
  status: certificateStatusEnum("status").notNull().default("ELIGIBLE"),
  
  // Issue date fields (used to fill the PDF)
  issueDate: timestamp("issue_date", { withTimezone: true }),
  
  // Signatures used when issued
  trainerSignatureId: text("trainer_signature_id").references(() => certificateSignatures.id, { onDelete: "set null" }),
  coordinatorSignatureId: text("coordinator_signature_id").references(() => certificateSignatures.id, { onDelete: "set null" }),
  
  // Admin actions
  issuedBy: text("issued_by").references(() => user.id, { onDelete: "set null" }),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  revokedBy: text("revoked_by").references(() => user.id, { onDelete: "set null" }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  revokeReason: text("revoke_reason"),
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // One certificate per profile per program (only when profile is linked)
  uniqueProfileProgram: sql`unique nulls not distinct (${table.profileId}, ${table.programId})`,
}));

// Type exports
export type CertificateSignature = typeof certificateSignatures.$inferSelect;
export type NewCertificateSignature = typeof certificateSignatures.$inferInsert;
export type ProgramCertificate = typeof programCertificates.$inferSelect;
export type NewProgramCertificate = typeof programCertificates.$inferInsert;
