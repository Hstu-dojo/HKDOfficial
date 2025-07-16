import { pgTable, text, integer, boolean, timestamp, real, json, pgEnum, serial, unique } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// Enums
export const roletypeEnum = pgEnum("roletype", ["ADMIN", "MODERATOR", "INSTRUCTOR", "MEMBER", "GUEST"]);
export const identityTypeEnum = pgEnum("identity_type", ["NID", "BIRTH_CERTIFICATE", "PASSPORT", "DRIVING_LICENSE"]);
export const providerTypeEnum = pgEnum("provider_type", ["Google", "GitHub"]);
export const resourceTypeEnum = pgEnum("resource_type", ["USER", "ACCOUNT", "SESSION", "PROVIDER", "ROLE", "PERMISSION", "COURSE", "BLOG", "MEDIA"]);
export const actionEnum = pgEnum("action", ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"]);

// Tables
export const emailLog = pgTable("email-log", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  payload: json("payload"),
});

export const user = pgTable("user", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  emailVerified: boolean("email_verified").default(false),
  password: text("password").notNull(),
  userName: text("user_name").unique().notNull(),
  userAvatar: text("user_avatar").notNull(),
  defaultRole: roletypeEnum("default_role").default("GUEST").notNull(),
  roleId: text("role_id").references(() => role.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const account = pgTable("account", {
  id: serial("id").primaryKey(),
  userId: text("user_id").unique().notNull().references(() => user.id),
  name: text("name").notNull(),
  nameBangla: text("name_bangla").notNull(),
  fatherName: text("father_name").notNull(),
  image: text("image").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  sex: text("sex").notNull(),
  dob: timestamp("dob", { withTimezone: true }).notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull(),
  postalCode: text("postal_code").notNull(),
  age: integer("age").notNull(),
  bloodGroup: text("blood_group").notNull(),
  height: real("height").notNull(),
  weight: real("weight").notNull(),
  occupation: text("occupation").notNull(),
  identityType: identityTypeEnum("identity_type").notNull(),
  identityNumber: text("identity_number").notNull(),
  identityImage: text("identity_image"),
  institute: text("institute").notNull(),
  faculty: text("faculty"),
  department: text("department"),
  session: text("session"),
  signatureImage: text("signature_image").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").unique().notNull(),
  userId: text("user_id").unique().notNull().references(() => user.id),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

export const provider = pgTable("provider", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => user.id),
  provider: providerTypeEnum("provider").notNull(),
  providerAccountId: text("provider_account_id"),
  profile: json("profile"),
  refreshToken: text("refresh_token"),
  accessToken: text("access_token"),
  expiresAt: integer("expires_at"),
  tokenType: text("token_type"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const level = pgTable("permission-group", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  levelName: text("level_name").notNull(),
  features: text("features").array().notNull(),
});

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

export const verificationToken = pgTable("verification-token", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  uid: text("uid").notNull().references(() => user.id),
  token: text("token").notNull(),
  validity: integer("validity").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const userRelations = relations(user, ({ one, many }) => ({
  account: one(account, {
    fields: [user.id],
    references: [account.userId],
  }),
  sessions: many(session),
  providers: many(provider),
  roles: many(userRole),
  verificationTokens: many(verificationToken),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const providerRelations = relations(provider, ({ one }) => ({
  user: one(user, {
    fields: [provider.userId],
    references: [user.id],
  }),
}));

export const userRoleRelations = relations(userRole, ({ one }) => ({
  user: one(user, {
    fields: [userRole.userId],
    references: [user.id],
  }),
  role: one(role, {
    fields: [userRole.roleId],
    references: [role.id],
  }),
}));

export const roleRelations = relations(role, ({ many }) => ({
  users: many(userRole),
  permissions: many(rolePermission),
}));

export const permissionRelations = relations(permission, ({ many }) => ({
  roles: many(rolePermission),
}));

export const rolePermissionRelations = relations(rolePermission, ({ one }) => ({
  role: one(role, {
    fields: [rolePermission.roleId],
    references: [role.id],
  }),
  permission: one(permission, {
    fields: [rolePermission.permissionId],
    references: [permission.id],
  }),
}));

export const levelRelations = relations(level, ({ many }) => ({
  // Keep existing level relations if needed
}));

export const verificationTokenRelations = relations(verificationToken, ({ one }) => ({
  user: one(user, {
    fields: [verificationToken.uid],
    references: [user.id],
  }),
}));

// Type exports
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Provider = typeof provider.$inferSelect;
export type NewProvider = typeof provider.$inferInsert;
export type UserRole = typeof userRole.$inferSelect;
export type NewUserRole = typeof userRole.$inferInsert;
export type Level = typeof level.$inferSelect;
export type NewLevel = typeof level.$inferInsert;
export type VerificationToken = typeof verificationToken.$inferSelect;
export type NewVerificationToken = typeof verificationToken.$inferInsert;
export type EmailLog = typeof emailLog.$inferSelect;
export type NewEmailLog = typeof emailLog.$inferInsert;
