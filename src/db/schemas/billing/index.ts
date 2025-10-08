import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { billStatusEnum, paymentMethodEnum } from "../enums";
import { user } from "../auth";
import { members } from "../karate";

// Billable items (fee types and amounts)
export const billableItems = pgTable("billable_items", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Monthly Fee", "Belt Test Fee", "Annual Tournament"
  description: text("description"),
  amount: integer("amount").notNull(), // amount in cents (e.g., 500000 for 5000 BDT)
  currency: text("currency").notNull().default('BDT'),
  isRecurring: boolean("is_recurring").notNull().default(false), // true for monthly fees
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Bills for members
export const bills = pgTable("bills", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  billableItemId: text("billable_item_id").notNull().references(() => billableItems.id),
  amount: integer("amount").notNull(), // amount at time of bill creation
  currency: text("currency").notNull().default('BDT'),
  billingMonth: text("billing_month"), // YYYY-MM format for monthly fees
  dueDate: timestamp("due_date", { withTimezone: true }),
  status: billStatusEnum("status").notNull().default('pending'),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment records
export const payments = pgTable("payments", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  billId: text("bill_id").notNull().references(() => bills.id, { onDelete: 'cascade' }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default('BDT'),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  transactionId: text("transaction_id"), // bKash transaction ID or reference
  paidAt: timestamp("paid_at", { withTimezone: true }).defaultNow().notNull(),
  approvedBy: text("approved_by").references(() => user.id), // admin or treasurer
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  receiptUrl: text("receipt_url"), // URL to downloadable receipt
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type BillableItem = typeof billableItems.$inferSelect;
export type NewBillableItem = typeof billableItems.$inferInsert;
export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;