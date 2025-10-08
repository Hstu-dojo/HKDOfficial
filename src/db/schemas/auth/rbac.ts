import { pgTable, text, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { resourceTypeEnum, actionEnum } from "../enums";
import { user } from "./users";

// RBAC Tables
export const role = pgTable("roles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const permission = pgTable("permissions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  description: text("description"),
  resource: resourceTypeEnum("resource").notNull(),
  action: actionEnum("action").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueResourceAction: unique().on(table.resource, table.action),
}));

export const rolePermission = pgTable("role_permissions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: text("role_id").notNull().references(() => role.id, { onDelete: "cascade" }),
  permissionId: text("permission_id").notNull().references(() => permission.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueRolePermission: unique().on(table.roleId, table.permissionId),
}));

export const userRole = pgTable("user_roles", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  roleId: text("role_id").notNull().references(() => role.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
  assignedBy: text("assigned_by").references(() => user.id, { onDelete: "set null" }),
  isActive: boolean("is_active").default(true).notNull(),
}, (table) => ({
  uniqueUserRole: unique().on(table.userId, table.roleId),
}));

// Legacy permission groups (if still needed)
export const level = pgTable("permission-group", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  levelName: text("level_name").notNull(),
  features: text("features").array().notNull(),
});

// Type exports
export type Role = typeof role.$inferSelect;
export type NewRole = typeof role.$inferInsert;
export type Permission = typeof permission.$inferSelect;
export type NewPermission = typeof permission.$inferInsert;
export type RolePermission = typeof rolePermission.$inferSelect;
export type NewRolePermission = typeof rolePermission.$inferInsert;
export type UserRole = typeof userRole.$inferSelect;
export type NewUserRole = typeof userRole.$inferInsert;
export type Level = typeof level.$inferSelect;
export type NewLevel = typeof level.$inferInsert;