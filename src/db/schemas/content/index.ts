import { pgTable, text, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth";

// Blogs
export const blogs = pgTable("blogs", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  content: text("content").notNull(), // Markdown content
  excerpt: text("excerpt"), // Short summary
  authorId: text("author_id").notNull().references(() => user.id),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Notices
export const notices = pgTable("notices", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown content
  authorId: text("author_id").notNull().references(() => user.id),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }), // Optional expiry date
  priority: integer("priority").notNull().default(0), // Higher = more important
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Photo Groups (Gallery Albums)
export const photoGroups = pgTable("photo_groups", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  slug: text("slug").notNull().unique(),
  coverImageUrl: text("cover_image_url"), // Featured image for the group
  authorId: text("author_id").notNull().references(() => user.id),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  displayOrder: integer("display_order").notNull().default(0), // For sorting groups
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Photos
export const photos = pgTable("photos", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  groupId: text("group_id").notNull().references(() => photoGroups.id, { onDelete: 'cascade' }),
  imageUrl: text("image_url").notNull(), // URL from Vercel Blob
  title: text("title"),
  description: text("description"),
  displayOrder: integer("display_order").notNull().default(0), // For sorting photos within a group
  uploadedBy: text("uploaded_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// System settings
export const systemSettings = pgTable("system_settings", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value"),
  description: text("description"),
  updatedBy: text("updated_by").references(() => user.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;
export type Notice = typeof notices.$inferSelect;
export type NewNotice = typeof notices.$inferInsert;
export type PhotoGroup = typeof photoGroups.$inferSelect;
export type NewPhotoGroup = typeof photoGroups.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type NewSystemSetting = typeof systemSettings.$inferInsert;