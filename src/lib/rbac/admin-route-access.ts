import type { ActionType, ResourceType } from './types';

type AccessPermissions = {
  permissions: { resource: ResourceType; action: ActionType }[];
  roles: { name: string; isActive?: boolean }[];
};

type Rule = { permission?: [ResourceType, ActionType]; roles?: string[] };
/** Default deny. Shared by server page guards, Edge middleware and navigation. */
export const adminRouteRules: Record<string, Rule> = {
  '/admin': { permission: ['REPORT', 'READ'] },
  '/admin/rbac': { permission: ['ROLE', 'READ'] },
  '/admin/create-admin': { permission: ['ROLE', 'UPDATE'] },
  '/admin/registrations': { permission: ['MEMBER', 'READ'] },
  '/admin/committees': { permission: ['MEMBER', 'READ'] },
  '/admin/courses': { permission: ['COURSE', 'READ'] },
  '/admin/gallery': { permission: ['GALLERY', 'READ'] },
  '/admin/programs': { permission: ['PROGRAM', 'READ'] },
  '/admin/programs/types': { permission: ['PROGRAM', 'READ'] },
  '/admin/programs/registrations': { permission: ['PROGRAM_REGISTRATION', 'READ'] },
  '/admin/programs/certificates': { permission: ['CERTIFICATE', 'READ'] },
  '/admin/programs/signatures': { permission: ['CERTIFICATE', 'READ'] },
  '/admin/competition-results': { permission: ['EVENT', 'READ'] },
  '/admin/enrollments': { permission: ['ENROLLMENT', 'READ'] },
  '/admin/monthly-fees': { permission: ['MONTHLY_FEE', 'READ'] },
  '/admin/org-billing': { permission: ['PARTNER_BILL', 'READ'] },
  '/admin/payment-settings': { permission: ['PAYMENT', 'MANAGE'] },
  '/admin/partners': { permission: ['PARTNER', 'READ'] },
  '/admin/certificates': { permission: ['CERTIFICATE', 'READ'] },
  '/admin/class-schedule': { permission: ['CLASS', 'READ'] },
  '/admin/announcements': { permission: ['ANNOUNCEMENT', 'READ'] },
  '/admin/reports': { permission: ['REPORT', 'READ'] },
  '/admin/emails': { roles: ['ADMIN', 'SUPER_ADMIN'] },
  '/admin/docs': { roles: ['ADMIN', 'SUPER_ADMIN'] },
  '/admin/settings': { roles: ['SUPER_ADMIN'] },
};

export function allowsPermission(permissions: Pick<AccessPermissions, 'permissions'>, resource: ResourceType, action: ActionType) {
  return permissions.permissions.some(p => p.resource === resource && (p.action === action || p.action === 'MANAGE'));
}
export function canAccessAdminRoute(permissions: AccessPermissions, pathname: string) {
  const path = pathname.replace(/^\/(en|bn|ne)(?=\/)/, '').replace(/\/$/, '');
  if (!allowsPermission(permissions, 'ADMIN_PANEL', 'ACCESS')) return false;
  const route = Object.keys(adminRouteRules).sort((a, b) => b.length - a.length)
    .find(key => path === key || (key !== '/admin' && path.startsWith(key + '/')));
  const rule = route && adminRouteRules[route];
  if (!rule) return false;
  if (rule.permission) return allowsPermission(permissions, ...rule.permission);
  return !!rule.roles?.some(name => permissions.roles.some(role => role.name === name && role.isActive !== false));
}
