import { pgTable, text, integer, boolean, timestamp, json, serial, unique, real } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { roletypeEnum, identityTypeEnum, providerTypeEnum } from "../enums";
import { role } from "./rbac";

// Core User Tables
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

export const verificationToken = pgTable("verification-token", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  uid: text("uid").notNull().references(() => user.id),
  token: text("token").notNull(),
  validity: integer("validity").default(1).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;
export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;
export type Provider = typeof provider.$inferSelect;
export type NewProvider = typeof provider.$inferInsert;
export type VerificationToken = typeof verificationToken.$inferSelect;
export type NewVerificationToken = typeof verificationToken.$inferInsert;
export type EmailLog = typeof emailLog.$inferSelect;
export type NewEmailLog = typeof emailLog.$inferInsert;