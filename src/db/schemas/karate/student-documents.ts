import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { partners, partnerAdmins } from "../partner";
import { profiles } from "./members";
export const quickEnrollmentDrafts = pgTable("quick_enrollment_drafts", {
  id: text("id").primaryKey(),
  partnerId: text("partner_id")
    .notNull()
    .references(() => partners.id, { onDelete: "cascade" }),
  adminId: text("admin_id")
    .notNull()
    .references(() => partnerAdmins.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("draft"),
  extracted: jsonb("extracted"),
  submissionEmail: text("submission_email"),
  provisionedAuthId: text("provisioned_auth_id"),
  profileId: text("profile_id").references(() => profiles.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});
export const studentDocuments = pgTable(
  "student_documents",
  {
    id: text("id").primaryKey(),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id, { onDelete: "cascade" }),
    profileId: text("profile_id").references(() => profiles.id, {
      onDelete: "cascade",
    }),
    draftId: text("draft_id").references(() => quickEnrollmentDrafts.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size").notNull(),
    bucket: text("bucket").notNull(),
    objectKey: text("object_key").notNull().unique(),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    profileIdx: index("student_documents_profile_idx").on(table.profileId),
    draftIdx: index("student_documents_draft_idx").on(table.draftId),
  }),
);
