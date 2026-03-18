import { pgEnum } from "drizzle-orm/pg-core";

// Auth and User Management Enums
export const roletypeEnum = pgEnum("roletype", ["ADMIN", "MODERATOR", "INSTRUCTOR", "MEMBER", "GUEST", "SUPER_ADMIN", "STUDENT", "USER"]); // USER kept in enum (can't remove PG enum values) but USER role is not seeded
export const identityTypeEnum = pgEnum("identity_type", ["NID", "BIRTH_CERTIFICATE", "PASSPORT", "DRIVING_LICENSE"]);
export const providerTypeEnum = pgEnum("provider_type", ["Google", "GitHub"]);

// RBAC Enums
export const resourceTypeEnum = pgEnum("resource_type", [
  "USER", "ACCOUNT", "SESSION", "PROVIDER", "ROLE", "PERMISSION", 
  "COURSE", "BLOG", "MEDIA", "CLASS", "EQUIPMENT", "MEMBER", "BILL", "PAYMENT",
  "GALLERY", "EVENT", "ANNOUNCEMENT", "CERTIFICATE", "REPORT",
  "ENROLLMENT", "MONTHLY_FEE", "SCHEDULE", "PROGRAM", "PROGRAM_REGISTRATION",
  "PARTNER", "PARTNER_BILL", "ADMIN_PANEL"
]);
export const actionEnum = pgEnum("action", ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE", "APPROVE", "VERIFY", "ACCESS"]);

// Karate-specific Enums
export const beltRankEnum = pgEnum('belt_rank', ['white', 'yellow', 'orange', 'green', 'blue', 'red', 'brown', 'black']);
export const classTypeEnum = pgEnum('class_type', ['beginner', 'intermediate', 'advanced', 'sparring', 'kata']);
export const equipmentStatusEnum = pgEnum('equipment_status', ['available', 'checked_out', 'maintenance', 'retired']);
export const registrationStatusEnum = pgEnum('registration_status', ['pending', 'approved', 'rejected']);
export const attendanceStatusEnum = pgEnum('attendance_status', ['present', 'absent', 'excused']);
export const studentLevelEnum = pgEnum('student_level', [
  'student_9th_kyu',
  'student_8th_kyu',
  'student_7th_kyu',
  'student_6th_kyu',
  'student_5th_kyu',
  'student_4th_kyu',
  'student_3rd_kyu',
  'student_2nd_kyu',
  'student_1st_kyu',
  'black_belt',
]);

// Billing Enums
export const billStatusEnum = pgEnum('bill_status', ['pending', 'paid', 'overdue', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['bkash', 'cash', 'bank_transfer']);