import { adminRouteRules, canAccessAdminRoute } from '@/lib/rbac/admin-route-access';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserPermissionsWithFallback } from '@/lib/rbac/permissions';

/**
 * Internal-only API endpoint to check if a user has admin panel access.
 * Called from middleware (Edge Runtime can't do direct DB queries).
 *
 * SECURITY: Protected by a shared internal secret so external callers
 * cannot probe admin status or enumerate roles.
 */

const INTERNAL_SECRET = process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || '';

export async function GET(request: NextRequest) {
  try {
    // ── Security: verify the request comes from our own middleware ──
    const internalSecret = request.headers.get('x-internal-secret');
    if (!INTERNAL_SECRET || internalSecret !== INTERNAL_SECRET) {
      return NextResponse.json({ hasAdminRole: false }, { status: 403 });
    }

    const supabaseUserId = request.headers.get('x-supabase-user-id');
    
    if (!supabaseUserId) {
      return NextResponse.json({ hasAdminRole: false, error: 'No user ID provided' }, { status: 400 });
    }

    // Get local user with their defaultRole
    const localUser = await db
      .select({ id: user.id, defaultRole: user.defaultRole })
      .from(user)
      .where(eq(user.supabaseUserId, supabaseUserId))
      .limit(1);

    if (localUser.length === 0) {
      return NextResponse.json({ hasAdminRole: false }, { status: 404 });
    }

    const userPerms = await getUserPermissionsWithFallback(localUser[0].id);
    const hasPanelAccess = userPerms.permissions.some(
      (p) => p.resource === 'ADMIN_PANEL' && (p.action === 'ACCESS' || p.action === 'MANAGE')
    );

    const requestedPath = request.headers.get('x-admin-path');
    const normalizedPath = requestedPath?.replace(/^\/(en|bn|ne)(?=\/)/, '').replace(/\/$/, '');
    const landing = hasPanelAccess && normalizedPath === '/admin' && !canAccessAdminRoute(userPerms, '/admin')
      ? Object.keys(adminRouteRules).find(route => route !== '/admin' && canAccessAdminRoute(userPerms, route)) : undefined;
    const locale = requestedPath?.match(/^\/(en|bn|ne)(?=\/)/)?.[1] || 'en';
    const hasAdminAccess = hasPanelAccess && (!requestedPath ||
      (requestedPath.startsWith('/docs')
        ? userPerms.roles.some(r => ['ADMIN', 'SUPER_ADMIN'].includes(r.name))
        : canAccessAdminRoute(userPerms, requestedPath)));

    const roles = userPerms.roles.map((r) => r.name);
    if (localUser[0].defaultRole && !roles.includes(localUser[0].defaultRole)) {
      roles.push(localUser[0].defaultRole);
    }

    // Return only what the middleware needs — no internal IDs
    return NextResponse.json({ 
      hasAdminRole: hasAdminAccess, 
      ...(landing ? { redirectTo: `/${locale}${landing}` } : {}),
      roles,
    });
  } catch (error) {
    console.error('[check-admin-role] Error:', error);
    return NextResponse.json({ hasAdminRole: false, error: 'Internal error' }, { status: 500 });
  }
}
