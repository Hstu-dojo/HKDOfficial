import { relations } from "drizzle-orm";

// Import all tables
import { 
  user, account, session, provider, verificationToken, 
  role, permission, rolePermission, userRole, level 
} from "./auth";
import { 
  profiles, members, registrations, classes, enrollments, attendance, 
  beltProgressions, equipment, equipmentCheckouts,
  courses, courseSchedules, courseInstructors,
  enrollmentApplications, courseEnrollments,
  monthlyFees, paymentReminders, paymentSettings,
  programs, programRegistrations,
  profileMonthlyStatus, memberMonthlyStatus, branchChangeRequests,
  certificateSignatures, programCertificates
} from "./karate";
import { billableItems, bills, payments } from "./billing";
import { 
  blogs, notices, photoGroups, photos, systemSettings,
  galleryFolders, galleryImages 
} from "./content";
import { partners, partnerBills, partnerPageSettings } from "./partner";

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
  profile: one(profiles, {
    fields: [user.id],
    references: [profiles.userId],
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
export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(user, {
    fields: [profiles.userId],
    references: [user.id],
  }),
  partner: one(partners, {
    fields: [profiles.partnerId],
    references: [partners.id],
  }),
  createdByUser: one(user, {
    fields: [profiles.createdBy],
    references: [user.id],
    relationName: "profileCreator",
  }),
  enrollments: many(enrollments),
  attendance: many(attendance),
  equipmentCheckouts: many(equipmentCheckouts),
  beltProgressions: many(beltProgressions),
  bills: many(bills),
  payments: many(payments),
  monthlyStatuses: many(profileMonthlyStatus),
  branchChangeRequests: many(branchChangeRequests),
  courseEnrollments: many(courseEnrollments),
  monthlyFees: many(monthlyFees),
  paymentReminders: many(paymentReminders),
  enrollmentApplications: many(enrollmentApplications),
  certificates: many(programCertificates),
  programRegistrations: many(programRegistrations),
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
  profile: one(profiles, {
    fields: [enrollments.profileId],
    references: [profiles.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  class: one(classes, {
    fields: [attendance.classId],
    references: [classes.id],
  }),
  profile: one(profiles, {
    fields: [attendance.profileId],
    references: [profiles.id],
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
  profile: one(profiles, {
    fields: [equipmentCheckouts.profileId],
    references: [profiles.id],
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
  profile: one(profiles, {
    fields: [beltProgressions.profileId],
    references: [profiles.id],
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
  partner: one(partners, {
    fields: [registrations.partnerId],
    references: [partners.id],
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
  profile: one(profiles, {
    fields: [bills.profileId],
    references: [profiles.id],
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
  profile: one(profiles, {
    fields: [payments.profileId],
    references: [profiles.id],
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
  partner: one(partners, {
    fields: [courses.partnerId],
    references: [partners.id],
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
  profile: one(profiles, {
    fields: [enrollmentApplications.profileId],
    references: [profiles.id],
  }),
}));

export const courseEnrollmentsRelations = relations(courseEnrollments, ({ one, many }) => ({
  course: one(courses, {
    fields: [courseEnrollments.courseId],
    references: [courses.id],
  }),
  profile: one(profiles, {
    fields: [courseEnrollments.profileId],
    references: [profiles.id],
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
  profile: one(profiles, {
    fields: [monthlyFees.profileId],
    references: [profiles.id],
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
  profile: one(profiles, {
    fields: [paymentReminders.profileId],
    references: [profiles.id],
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
  certificates: many(programCertificates),
  creator: one(user, {
    fields: [programs.createdBy],
    references: [user.id],
  }),
  course: one(courses, {
    fields: [programs.courseId],
    references: [courses.id],
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
  profile: one(profiles, {
    fields: [programRegistrations.profileId],
    references: [profiles.id],
  }),
  verifier: one(user, {
    fields: [programRegistrations.verifiedBy],
    references: [user.id],
    relationName: "verifiedBy",
  }),
}));

// Partner Relations
export const partnersRelations = relations(partners, ({ one, many }) => ({
  profiles: many(profiles),
  courses: many(courses),
  bills: many(partnerBills),
  registrations: many(registrations),
  monthlyStatuses: many(profileMonthlyStatus),
  branchChangeRequestsTo: many(branchChangeRequests, { relationName: "toPartner" }),
  pageSettings: one(partnerPageSettings, {
    fields: [partners.id],
    references: [partnerPageSettings.partnerId],
  }),
}));

export const partnerBillsRelations = relations(partnerBills, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerBills.partnerId],
    references: [partners.id],
  }),
  generatedByUser: one(user, {
    fields: [partnerBills.generatedBy],
    references: [user.id],
    relationName: "billGenerator",
  }),
  verifiedByUser: one(user, {
    fields: [partnerBills.verifiedBy],
    references: [user.id],
    relationName: "billVerifier",
  }),
}));

export const partnerPageSettingsRelations = relations(partnerPageSettings, ({ one }) => ({
  partner: one(partners, {
    fields: [partnerPageSettings.partnerId],
    references: [partners.id],
  }),
}));

export const profileMonthlyStatusRelations = relations(profileMonthlyStatus, ({ one }) => ({
  profile: one(profiles, {
    fields: [profileMonthlyStatus.profileId],
    references: [profiles.id],
  }),
  partner: one(partners, {
    fields: [profileMonthlyStatus.partnerId],
    references: [partners.id],
  }),
}));

export const branchChangeRequestsRelations = relations(branchChangeRequests, ({ one }) => ({
  profile: one(profiles, {
    fields: [branchChangeRequests.profileId],
    references: [profiles.id],
  }),
  user: one(user, {
    fields: [branchChangeRequests.userId],
    references: [user.id],
  }),
  fromPartner: one(partners, {
    fields: [branchChangeRequests.fromPartnerId],
    references: [partners.id],
    relationName: "fromPartner",
  }),
  toPartner: one(partners, {
    fields: [branchChangeRequests.toPartnerId],
    references: [partners.id],
    relationName: "toPartner",
  }),
}));

// Certificate Relations
export const certificateSignaturesRelations = relations(certificateSignatures, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [certificateSignatures.createdBy],
    references: [user.id],
  }),
  certificatesAsTrainer: many(programCertificates, {
    relationName: "trainerSignature",
  }),
  certificatesAsCoordinator: many(programCertificates, {
    relationName: "coordinatorSignature",
  }),
}));

export const programCertificatesRelations = relations(programCertificates, ({ one }) => ({
  program: one(programs, {
    fields: [programCertificates.programId],
    references: [programs.id],
  }),
  profile: one(profiles, {
    fields: [programCertificates.profileId],
    references: [profiles.id],
  }),
  trainerSignature: one(certificateSignatures, {
    fields: [programCertificates.trainerSignatureId],
    references: [certificateSignatures.id],
    relationName: "trainerSignature",
  }),
  coordinatorSignature: one(certificateSignatures, {
    fields: [programCertificates.coordinatorSignatureId],
    references: [certificateSignatures.id],
    relationName: "coordinatorSignature",
  }),
  issuedByUser: one(user, {
    fields: [programCertificates.issuedBy],
    references: [user.id],
    relationName: "certIssuer",
  }),
  revokedByUser: one(user, {
    fields: [programCertificates.revokedBy],
    references: [user.id],
    relationName: "certRevoker",
  }),
}));
