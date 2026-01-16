import { pgTable, text, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth";
import { courses } from "./courses";
import { members } from "./members";
import { pgEnum } from "drizzle-orm/pg-core";

// Enrollment Application Status Enum
export const enrollmentApplicationStatusEnum = pgEnum('enrollment_application_status', [
  'pending_payment',    // Initial - waiting for payment
  'payment_submitted',  // Payment proof submitted, waiting for verification
  'payment_verified',   // Payment verified, waiting for admission approval
  'approved',           // Approved and enrolled
  'rejected',           // Application rejected
  'cancelled',          // Cancelled by user
]);

// Enrollment Applications - when a user applies to join a course
export const enrollmentApplications = pgTable("enrollment_applications", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationNumber: text("application_number").notNull().unique(), // e.g., "HKD-2026-001"
  
  // Applicant Info
  userId: text("user_id").notNull().references(() => user.id, { onDelete: 'cascade' }),
  courseId: text("course_id").notNull().references(() => courses.id),
  
  // Student Information (collected during application)
  studentInfo: jsonb("student_info").$type<{
    fullNameEnglish: string;
    fullNameBangla?: string;
    fatherName: string;
    fatherNameBangla?: string;
    motherName: string;
    motherNameBangla?: string;
    dateOfBirth: string; // ISO date
    gender: 'male' | 'female' | 'other';
    bloodGroup: string;
    religion?: string;
    nationality: string;
    phoneNumber: string;
    email: string;
    presentAddress: string;
    permanentAddress: string;
    nid?: string;
    birthCertificateNo?: string;
    passportNo?: string;
    profession?: string;
    educationQualification?: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
    emergencyContactRelation: string;
    profilePhotoUrl?: string;
    signatureUrl?: string;
    hasMedicalCondition: boolean;
    medicalConditionDetails?: string;
    previousMartialArtsExperience?: string;
    howDidYouHear?: string;
    agreeToTerms: boolean;
    agreeToWaiver: boolean; // Liability waiver
  }>().notNull(),
  
  // Payment Details
  admissionFeeAmount: integer("admission_fee_amount").notNull(), // Amount to pay
  currency: text("currency").notNull().default('BDT'),
  
  // Payment Proof
  paymentMethod: text("payment_method").default('bkash'), // bkash, bank_transfer, etc.
  transactionId: text("transaction_id"), // bKash transaction ID
  paymentProofUrl: text("payment_proof_url"), // Screenshot of payment
  paymentSubmittedAt: timestamp("payment_submitted_at", { withTimezone: true }),
  
  // Status
  status: enrollmentApplicationStatusEnum("status").notNull().default('pending_payment'),
  
  // Payment Verification
  paymentVerifiedBy: text("payment_verified_by").references(() => user.id),
  paymentVerifiedAt: timestamp("payment_verified_at", { withTimezone: true }),
  paymentVerificationNotes: text("payment_verification_notes"),
  
  // Admission Review
  reviewedBy: text("reviewed_by").references(() => user.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  rejectionReason: text("rejection_reason"),
  
  // If approved, link to member record
  memberId: text("member_id").references(() => members.id),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Course Enrollments - confirmed enrollments linking members to courses
export const courseEnrollments = pgTable("course_enrollments", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  courseId: text("course_id").notNull().references(() => courses.id),
  memberId: text("member_id").notNull().references(() => members.id, { onDelete: 'cascade' }),
  applicationId: text("application_id").references(() => enrollmentApplications.id),
  
  // Enrollment details
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).defaultNow().notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  expectedEndDate: timestamp("expected_end_date", { withTimezone: true }),
  
  // Monthly fee at time of enrollment
  monthlyFee: integer("monthly_fee").notNull(),
  currency: text("currency").notNull().default('BDT'),
  
  // Status
  isActive: boolean("is_active").notNull().default(true),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  droppedAt: timestamp("dropped_at", { withTimezone: true }),
  dropReason: text("drop_reason"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Type exports
export type EnrollmentApplication = typeof enrollmentApplications.$inferSelect;
export type NewEnrollmentApplication = typeof enrollmentApplications.$inferInsert;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type NewCourseEnrollment = typeof courseEnrollments.$inferInsert;
