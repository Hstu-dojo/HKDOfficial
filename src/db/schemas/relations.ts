import { relations } from "drizzle-orm";

// Import all tables
import { 
  user, account, session, provider, verificationToken, 
  role, permission, rolePermission, userRole, level 
} from "./auth";
import { 
  members, registrations, classes, enrollments, attendance, 
  beltProgressions, equipment, equipmentCheckouts,
  courses, courseSchedules, courseInstructors,
  enrollmentApplications, courseEnrollments,
  monthlyFees, paymentReminders, paymentSettings,
  programs, programRegistrations
} from "./karate";
import { billableItems, bills, payments } from "./billing";
import { 
  blogs, notices, photoGroups, photos, systemSettings,
  galleryFolders, galleryImages 
} from "./content";

// Auth Relations
export const userRelations = relations(user, ({ one, many }) => ({
  account: one(account, {
    fields: [user.id],
    references: [account.userId],
  }),
  sessions: many(session),
  providers: many(provider),
  roles: many(userRole),
  verificationTokens: many(verificationToken),
  // Karate-specific relations
  member: one(members, {
    fields: [user.id],
    references: [members.userId],
  }),
  coachClasses: many(classes),
  equipmentCheckouts: many(equipmentCheckouts, {
    relationName: "checkedOutBy"
  }),
  equipmentCheckIns: many(equipmentCheckouts, {
    relationName: "checkedInBy"
  }),
  beltProgressions: many(beltProgressions),
  registrationsReviewed: many(registrations, {
    relationName: "reviewedBy"
  }),
  paymentsApproved: many(payments),
  blogs: many(blogs),
  notices: many(notices),
  photoGroups: many(photoGroups),
  photos: many(photos),
  systemSettingsUpdated: many(systemSettings),
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

// Karate Relations
export const membersRelations = relations(members, ({ one, many }) => ({
  user: one(user, {
    fields: [members.userId],
    references: [user.id],
  }),
  enrollments: many(enrollments),
  attendance: many(attendance),
  equipmentCheckouts: many(equipmentCheckouts),
  beltProgressions: many(beltProgressions),
  bills: many(bills),
  payments: many(payments),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  coach: one(user, {
    fields: [classes.coachId],
    references: [user.id],
  }),
  enrollments: many(enrollments),
  attendance: many(attendance),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  class: one(classes, {
    fields: [enrollments.classId],
    references: [classes.id],
  }),
  member: one(members, {
    fields: [enrollments.memberId],
    references: [members.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
  member: one(members, {
    fields: [attendance.memberId],
    references: [members.id],
  }),
}));

export const equipmentRelations = relations(equipment, ({ many }) => ({
  checkouts: many(equipmentCheckouts),
}));

export const equipmentCheckoutsRelations = relations(equipmentCheckouts, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentCheckouts.equipmentId],
    references: [equipment.id],
  }),
  member: one(members, {
    fields: [equipmentCheckouts.memberId],
    references: [members.id],
  }),
  checkedOutByUser: one(user, {
    fields: [equipmentCheckouts.checkedOutBy],
    references: [user.id],
    relationName: "checkedOutBy"
  }),
  checkedInByUser: one(user, {
    fields: [equipmentCheckouts.checkedInBy],
    references: [user.id],
    relationName: "checkedInBy"
  }),
}));

export const beltProgressionsRelations = relations(beltProgressions, ({ one }) => ({
  member: one(members, {
    fields: [beltProgressions.memberId],
    references: [members.id],
  }),
  awardedByUser: one(user, {
    fields: [beltProgressions.awardedBy],
    references: [user.id],
  }),
}));

export const registrationsRelations = relations(registrations, ({ one }) => ({
  user: one(user, {
    fields: [registrations.userId],
    references: [user.id],
  }),
  reviewer: one(user, {
    fields: [registrations.reviewedBy],
    references: [user.id],
    relationName: "reviewedBy"
  }),
}));

// Billing Relations
export const billableItemsRelations = relations(billableItems, ({ many }) => ({
  bills: many(bills),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  member: one(members, {
    fields: [bills.memberId],
    references: [members.id],
  }),
  billableItem: one(billableItems, {
    fields: [bills.billableItemId],
    references: [billableItems.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id],
  }),
  member: one(members, {
    fields: [payments.memberId],
    references: [members.id],
  }),
  approver: one(user, {
    fields: [payments.approvedBy],
    references: [user.id],
  }),
}));

// Content Relations
export const blogsRelations = relations(blogs, ({ one }) => ({
  author: one(user, {
    fields: [blogs.authorId],
    references: [user.id],
  }),
}));

export const noticesRelations = relations(notices, ({ one }) => ({
  author: one(user, {
    fields: [notices.authorId],
    references: [user.id],
  }),
}));

export const photoGroupsRelations = relations(photoGroups, ({ one, many }) => ({
  author: one(user, {
    fields: [photoGroups.authorId],
    references: [user.id],
  }),
  photos: many(photos),
}));

export const photosRelations = relations(photos, ({ one }) => ({
  group: one(photoGroups, {
    fields: [photos.groupId],
    references: [photoGroups.id],
  }),
  uploader: one(user, {
    fields: [photos.uploadedBy],
    references: [user.id],
  }),
}));

export const systemSettingsRelations = relations(systemSettings, ({ one }) => ({
  updater: one(user, {
    fields: [systemSettings.updatedBy],
    references: [user.id],
  }),
}));

// Course Relations
export const coursesRelations = relations(courses, ({ one, many }) => ({
  creator: one(user, {
    fields: [courses.createdBy],
    references: [user.id],
  }),
  schedules: many(courseSchedules),
  instructors: many(courseInstructors),
  enrollmentApplications: many(enrollmentApplications),
  courseEnrollments: many(courseEnrollments),
}));

export const courseSchedulesRelations = relations(courseSchedules, ({ one }) => ({
  course: one(courses, {
    fields: [courseSchedules.courseId],
    references: [courses.id],
  }),
}));

export const courseInstructorsRelations = relations(courseInstructors, ({ one }) => ({
  course: one(courses, {
    fields: [courseInstructors.courseId],
    references: [courses.id],
  }),
  instructor: one(user, {
    fields: [courseInstructors.instructorId],
    references: [user.id],
  }),
}));

// Enrollment Application Relations
export const enrollmentApplicationsRelations = relations(enrollmentApplications, ({ one }) => ({
  user: one(user, {
    fields: [enrollmentApplications.userId],
    references: [user.id],
  }),
  course: one(courses, {
    fields: [enrollmentApplications.courseId],
    references: [courses.id],
  }),
  paymentVerifier: one(user, {
    fields: [enrollmentApplications.paymentVerifiedBy],
    references: [user.id],
    relationName: "paymentVerifier",
  }),
  reviewer: one(user, {
    fields: [enrollmentApplications.reviewedBy],
    references: [user.id],
    relationName: "applicationReviewer",
  }),
  member: one(members, {
    fields: [enrollmentApplications.memberId],
    references: [members.id],
  }),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseEnrollments.courseId],
    references: [courses.id],
  }),
  member: one(members, {
    fields: [courseEnrollments.memberId],
    references: [members.id],
  }),
  application: one(enrollmentApplications, {
    fields: [courseEnrollments.applicationId],
    references: [enrollmentApplications.id],
  }),
  monthlyFees: many(monthlyFees),
}));

// Monthly Fee Relations
export const monthlyFeesRelations = relations(monthlyFees, ({ one, many }) => ({
  enrollment: one(courseEnrollments, {
    fields: [monthlyFees.enrollmentId],
    references: [courseEnrollments.id],
  }),
  member: one(members, {
    fields: [monthlyFees.memberId],
    references: [members.id],
  }),
  verifier: one(user, {
    fields: [monthlyFees.verifiedBy],
    references: [user.id],
    relationName: "feeVerifier",
  }),
  waiver: one(user, {
    fields: [monthlyFees.waivedBy],
    references: [user.id],
    relationName: "feeWaiver",
  }),
  reminders: many(paymentReminders),
}));

export const paymentRemindersRelations = relations(paymentReminders, ({ one }) => ({
  monthlyFee: one(monthlyFees, {
    fields: [paymentReminders.monthlyFeeId],
    references: [monthlyFees.id],
  }),
  member: one(members, {
    fields: [paymentReminders.memberId],
    references: [members.id],
  }),
}));

export const paymentSettingsRelations = relations(paymentSettings, ({ one }) => ({
  updater: one(user, {
    fields: [paymentSettings.updatedBy],
    references: [user.id],
  }),
}));

// Gallery Relations
export const galleryFoldersRelations = relations(galleryFolders, ({ one, many }) => ({
  parent: one(galleryFolders, {
    fields: [galleryFolders.parentId],
    references: [galleryFolders.id],
    relationName: "parentFolder",
  }),
  children: many(galleryFolders, {
    relationName: "parentFolder",
  }),
  images: many(galleryImages),
  createdByUser: one(user, {
    fields: [galleryFolders.createdBy],
    references: [user.id],
    relationName: "folderCreator",
  }),
  updatedByUser: one(user, {
    fields: [galleryFolders.updatedBy],
    references: [user.id],
    relationName: "folderUpdater",
  }),
}));

export const galleryImagesRelations = relations(galleryImages, ({ one }) => ({
  folder: one(galleryFolders, {
    fields: [galleryImages.folderId],
    references: [galleryFolders.id],
  }),
  uploadedByUser: one(user, {
    fields: [galleryImages.uploadedBy],
    references: [user.id],
  }),
}));
// Program Relations
export const programsRelations = relations(programs, ({ one, many }) => ({
  registrations: many(programRegistrations),
  creator: one(user, {
    fields: [programs.createdBy],
    references: [user.id],
  }),
}));

export const programRegistrationsRelations = relations(programRegistrations, ({ one }) => ({
  program: one(programs, {
    fields: [programRegistrations.programId],
    references: [programs.id],
  }),
  user: one(user, {
    fields: [programRegistrations.userId],
    references: [user.id],
  }),
  verifier: one(user, {
    fields: [programRegistrations.verifiedBy],
    references: [user.id],
    relationName: "verifiedBy",
  }),
}));
