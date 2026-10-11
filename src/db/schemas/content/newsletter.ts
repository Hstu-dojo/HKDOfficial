import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  source: text("source").notNull(),
  status: text("status").notNull().default("pending"),
  providerId: text("provider_id"),
  error: text("error"),
  nextAttemptAt: timestamp("next_attempt_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const newsletterBroadcasts = pgTable(
  "newsletter_broadcasts",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    sourceKey: text("source_key").notNull().unique(),
    noticeId: text("notice_id"),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    format: text("format")
      .$type<"markdown" | "html">()
      .notNull()
      .default("markdown"),
    attachments: jsonb("attachments").$type<string[]>().notNull().default([]),
    status: text("status").notNull().default("draft"),
    providerId: text("provider_id"),
    segmentId: text("segment_id"),
    error: text("error"),
    createdBy: text("created_by"),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull().defaultNow(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    queue: index("newsletter_broadcast_queue_idx").on(t.status, t.dueAt),
  }),
);
export const newsletterAttachments = pgTable("newsletter_attachments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  key: text("key").notNull().unique(),
  type: text("type").notNull(),
  bytes: integer("bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const newsletterWebhookEvents = pgTable("newsletter_webhook_events", {
  id: text("id").primaryKey(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
