import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { pgEnum } from "drizzle-orm/pg-core";
import { user } from "../auth";
import { members } from "./members";
import { courseEnrollments } from "./enrollments";

// Monthly Fee Status Enum
export const monthlyFeeStatusEnum = pgEnum('monthly_fee_status', [
  'pending',           // Fee not yet due or just created
  'due',               // Fee is due, payment expected
  'payment_submitted', // Payment proof submitted
  'paid',              // Payment verified and confirmed
  'overdue',           // Past due date, not paid
  'waived',            // Fee waived by admin
  'partial',           // Partial payment made
]);

// Monthly Fees - track monthly payments for each enrolled student
export const monthlyFees = pgTable("monthly_fees", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Link to enrollment
  enrollmentId: text("enrollment_id").notNull().references(() => courseEnrollments.id, { onDelete: 'cascade' }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  
  // Billing Period
  billingMonth: text("billing_month").notNull(), // Format: "2026-01" (YYYY-MM)
  billingYear: integer("billing_year").notNull(),
  
  // Amount
  amount: integer("amount").notNull(), // Amount in cents/paisa
  currency: text("currency").notNull().default('BDT'),
  amountPaid: integer("amount_paid").default(0), // For partial payments
  
  // Due Date
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  
  // Payment Details
  status: monthlyFeeStatusEnum("status").notNull().default('pending'),
  paymentMethod: text("payment_method"), // bkash, cash, bank_transfer
  transactionId: text("transaction_id"),
  paymentProofUrl: text("payment_proof_url"),
  paymentSubmittedAt: timestamp("payment_submitted_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  
  // Verification
  verifiedBy: text("verified_by").references(() => user.id),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verificationNotes: text("verification_notes"),
  
  // Waiver info (if waived)
  waivedBy: text("waived_by").references(() => user.id),
  waivedAt: timestamp("waived_at", { withTimezone: true }),
  waiverReason: text("waiver_reason"),
  
  // Reminder tracking
  remindersSent: integer("reminders_sent").default(0),
  lastReminderAt: timestamp("last_reminder_at", { withTimezone: true }),
  
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment Reminders - track notification history
export const paymentReminders = pgTable("payment_reminders", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  monthlyFeeId: text("monthly_fee_id").notNull().references(() => monthlyFees.id, { onDelete: 'cascade' }),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  
  // Reminder Details
  reminderType: text("reminder_type").notNull(), // 'email', 'sms', 'push'
  recipientEmail: text("recipient_email"),
  recipientPhone: text("recipient_phone"),
  
  // Content
  subject: text("subject"),
  message: text("message"),
  
  // Status
  sentAt: timestamp("sent_at", { withTimezone: true }).defaultNow().notNull(),
  deliveryStatus: text("delivery_status").default('sent'), // sent, delivered, failed
  errorMessage: text("error_message"),
  
  // Metadata
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment Settings - admin configurable payment settings
export const paymentSettings = pgTable("payment_settings", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // e.g., "bkash_merchant_number", "payment_due_day"
  value: text("value").notNull(),
  description: text("description"),
  valueType: text("value_type").notNull().default('string'), // string, number, boolean, json
  isPublic: boolean("is_public").notNull().default(false), // Can be shown to users
  updatedBy: text("updated_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Payment Method Enum
export const paymentMethodTypeEnum = pgEnum('payment_method_type', [
  'bkash',
  'nagad',
  'rocket',
  'upay',
  'bank_transfer',
  'cash',
]);

// Payment Scope Enum - what does this payment account apply to
export const paymentScopeEnum = pgEnum('payment_scope', [
  'default',           // Default for everything
  'program',           // Specific program
  'course',            // Specific course
  'enrollment',        // Enrollment fees
  'monthly_fee',       // Monthly fees
  'event',             // Events
]);

// Payment Accounts - admin configurable payment accounts with scopes
export const paymentAccounts = pgTable("payment_accounts", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Account details
  name: text("name").notNull(), // e.g., "Main bKash Account", "HKD Nagad"
  methodType: paymentMethodTypeEnum("method_type").notNull(), // bkash, nagad, etc.
  accountNumber: text("account_number").notNull(), // The phone/account number
  accountName: text("account_name"), // Name shown on the account (optional)
  
  // Additional info
  qrCodeUrl: text("qr_code_url"), // URL to QR code image
  instructions: text("instructions"), // Instructions for payment
  
  // Scope - what this account is used for
  scope: paymentScopeEnum("scope").notNull().default('default'),
  scopeId: text("scope_id"), // ID of the program/course if scope is specific
  scopeName: text("scope_name"), // Name of the program/course for display
  
  // Priority - if multiple accounts exist for same scope, use highest priority
  priority: integer("priority").notNull().default(0),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false), // Is this the default for its scope
  
  // Metadata
  createdBy: text("created_by").references(() => user.id),
  updatedBy: text("updated_by").references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type MonthlyFee = typeof monthlyFees.$inferSelect;
export type NewMonthlyFee = typeof monthlyFees.$inferInsert;
export type PaymentReminder = typeof paymentReminders.$inferSelect;
export type NewPaymentReminder = typeof paymentReminders.$inferInsert;
export type PaymentSetting = typeof paymentSettings.$inferSelect;
export type NewPaymentSetting = typeof paymentSettings.$inferInsert;
export type PaymentAccount = typeof paymentAccounts.$inferSelect;
export type NewPaymentAccount = typeof paymentAccounts.$inferInsert;
