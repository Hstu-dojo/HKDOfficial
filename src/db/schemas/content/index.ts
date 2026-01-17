import { pgTable, text, boolean, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
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

// Photo Groups (Gallery Albums) - Legacy table, use galleryFolders instead
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

// Photos - Legacy table, use galleryImages instead
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

// =============================================
// New Gallery System with Cloudinary Integration
// =============================================

// Gallery Folders (sub-galleries/albums)
export const galleryFolders = pgTable("gallery_folders", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  parentId: text("parent_id").references((): any => galleryFolders.id, { onDelete: 'cascade' }), // For nested folders
  cloudinaryFolder: text("cloudinary_folder").notNull(), // Cloudinary folder path
  coverImageId: text("cover_image_id"), // Reference to a gallery image
  isPublished: boolean("is_published").notNull().default(false),
  displayOrder: integer("display_order").notNull().default(0),
  createdBy: text("created_by").notNull().references(() => user.id),
  updatedBy: text("updated_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Gallery Images with Cloudinary metadata
export const galleryImages = pgTable("gallery_images", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  folderId: text("folder_id").references(() => galleryFolders.id, { onDelete: 'cascade' }),
  // Cloudinary fields
  publicId: text("public_id").notNull().unique(), // Cloudinary public_id
  assetId: text("asset_id"), // Cloudinary asset_id
  secureUrl: text("secure_url").notNull(), // Full Cloudinary URL
  format: text("format"), // jpg, png, webp, etc.
  resourceType: text("resource_type").default("image"), // image, video, raw
  width: integer("width"),
  height: integer("height"),
  bytes: integer("bytes"), // File size in bytes
  // Metadata
  title: text("title"),
  description: text("description"),
  altText: text("alt_text"),
  tags: jsonb("tags").$type<string[]>().default([]),
  // Display
  displayOrder: integer("display_order").notNull().default(0),
  isFeatured: boolean("is_featured").notNull().default(false),
  isPublished: boolean("is_published").notNull().default(true),
  // Tracking
  uploadedBy: text("uploaded_by").notNull().references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
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

// Gallery types
export type GalleryFolder = typeof galleryFolders.$inferSelect;
export type NewGalleryFolder = typeof galleryFolders.$inferInsert;
export type GalleryImage = typeof galleryImages.$inferSelect;
export type NewGalleryImage = typeof galleryImages.$inferInsert;