import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserPermissionsWithFallback } from '@/lib/rbac/permissions';

/**
 * API endpoint to get user RBAC data (roles and permissions)
 * Called from client-side useRBAC hook
 * Uses supabaseUserId from header to avoid cookie issues
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUserId = request.headers.get('x-supabase-user-id');
    
    if (!supabaseUserId) {
      return NextResponse.json({ error: 'No user ID provided' }, { status: 400 });
    }

    console.log('[get-user-rbac] Checking RBAC for Supabase ID:', supabaseUserId);

    // Get local user ID from Supabase user ID
    const localUser = await db
      .select({ id: user.id, defaultRole: user.defaultRole })
      .from(user)
      .where(eq(user.supabaseUserId, supabaseUserId))
      .limit(1);

    if (localUser.length === 0) {
      console.log('[get-user-rbac] User not found for Supabase ID:', supabaseUserId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const localUserId = localUser[0].id;
    const defaultRole = localUser[0].defaultRole;
    
    console.log('[get-user-rbac] Found local user:', localUserId, 'defaultRole:', defaultRole);

    const userPermissions = await getUserPermissionsWithFallback(localUserId);
    const roles = userPermissions.roles;
    const permissions = userPermissions.permissions;

    console.log('[get-user-rbac] Final result:', {
      localUserId,
      roles: roles.map(r => r.name),
      permissionCount: permissions.length
    });

    return NextResponse.json({
      localUserId,
      roles,
      permissions,
    });
  } catch (error) {
    console.error('[get-user-rbac] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
