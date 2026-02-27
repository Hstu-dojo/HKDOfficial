/**
 * Shared RBAC constants — single source of truth for role lists used across the app.
 *
 * Keep this file free of heavy imports so it can be consumed from Edge Runtime
 * (middleware), server components, client hooks, and API routes alike.
 */

/** Roles that grant access to the /admin dashboard. */
export const ADMIN_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'INSTRUCTOR',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

/** All role names seeded in the RBAC system. */
export const ALL_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MODERATOR',
  'INSTRUCTOR',
  'STUDENT',
  'USER',
  'MEMBER',
  'GUEST',
] as const;

export type RoleName = (typeof ALL_ROLES)[number];
