import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { equipmentStatusEnum } from "../enums";
import { user } from "../auth";
import { members } from "./members";

// Equipment inventory
export const equipment = pgTable("equipment", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // gi, belts, pads, training equipment
  equipmentCode: text("equipment_code").notNull().unique(),
  status: equipmentStatusEnum("status").notNull().default('available'),
  purchaseDate: timestamp("purchase_date", { withTimezone: true }),
  condition: text("condition"), // excellent, good, fair, poor
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Equipment checkouts
export const equipmentCheckouts = pgTable("equipment_checkouts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentId: text("equipment_id").notNull().references(() => equipment.id, { onDelete: 'cascade' }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  checkedOutAt: timestamp("checked_out_at", { withTimezone: true }).defaultNow().notNull(),
  checkedOutBy: text("checked_out_by").notNull().references(() => user.id), // equipment manager
  dueDate: timestamp("due_date", { withTimezone: true }),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  checkedInBy: text("checked_in_by").references(() => user.id),
  notes: text("notes"),
});

// Type exports
export type Equipment = typeof equipment.$inferSelect;
export type NewEquipment = typeof equipment.$inferInsert;
export type EquipmentCheckout = typeof equipmentCheckouts.$inferSelect;
export type NewEquipmentCheckout = typeof equipmentCheckouts.$inferInsert;