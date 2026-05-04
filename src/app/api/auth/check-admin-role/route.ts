import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserPermissionsWithFallback } from '@/lib/rbac/permissions';

/**
 * API endpoint to check if a user has admin panel access
 * Called from middleware (Edge Runtime can't do direct DB queries)
 * 
 * Checks for the ADMIN_PANEL:ACCESS permission via:
 *  1. Roles assigned in the userRole table
 *  2. Fallback to user.defaultRole
 * 
 * Which roles can access the admin panel is controlled by toggling
 * the "access_admin_panel" permission in the RBAC permission matrix.
 */
export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ hasAdminRole: false, error: 'User not found' }, { status: 404 });
    }

    const userPerms = await getUserPermissionsWithFallback(localUser[0].id);
    const hasAdminAccess = userPerms.permissions.some(
      (p) => p.resource === 'ADMIN_PANEL' && (p.action === 'ACCESS' || p.action === 'MANAGE')
    );

    const roles = userPerms.roles.map((r) => r.name);
    if (localUser[0].defaultRole && !roles.includes(localUser[0].defaultRole)) {
      roles.push(localUser[0].defaultRole);
    }

    return NextResponse.json({ 
      hasAdminRole: hasAdminAccess, 
      roles,
      localUserId: localUser[0].id,
      defaultRole: localUser[0].defaultRole,
    });
  } catch (error) {
    console.error('[check-admin-role] Error:', error);
    return NextResponse.json({ hasAdminRole: false, error: 'Internal error' }, { status: 500 });
  }
}
