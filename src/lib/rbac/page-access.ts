import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { getRBACContext } from './middleware';
import { getUserPermissionsWithFallback } from './permissions';
import { adminRouteRules, allowsPermission, canAccessAdminRoute } from './admin-route-access';

const getPageAccess = cache(async () => {
  const context = await getRBACContext();
  return { context, permissions: context ? await getUserPermissionsWithFallback(context.userId) : null };
});
export async function requireAdminPanelAccess(locale = 'en') {
  const access = await getPageAccess();
  if (!access.context) redirect(`/${locale}/login?callbackUrl=/${locale}/admin`);
  if (!access.permissions || !allowsPermission(access.permissions, 'ADMIN_PANEL', 'ACCESS')) redirect('/unauthorized');
  return access;
}
export async function requireAdminPageAccess(path: string, locale = 'en') {
  const access = await requireAdminPanelAccess(locale);
  if (path === '/admin' && access.permissions && !canAccessAdminRoute(access.permissions, path)) {
    const landing = Object.keys(adminRouteRules).find(route => route !== '/admin' && canAccessAdminRoute(access.permissions!, route));
    if (landing) redirect(`/${locale}${landing}`);
  }
  if (!access.permissions || !canAccessAdminRoute(access.permissions, path)) redirect('/unauthorized');
  return access.context;
}
