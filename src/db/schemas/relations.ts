import { relations } from "drizzle-orm";

// Import all tables
import { 
  user, account, session, provider, verificationToken, 
  role, permission, rolePermission, userRole, level 
} from "./auth";
import { 
  members, registrations, classes, enrollments, attendance, 
  beltProgressions, equipment, equipmentCheckouts 
} from "./karate";
import { billableItems, bills, payments } from "./billing";
import { blogs, notices, photoGroups, photos, systemSettings } from "./content";

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