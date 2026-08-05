import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { getUserPermissionsWithFallback } from '@/lib/rbac/permissions';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint to get user RBAC data (roles and permissions).
 * Called from client-side useRBAC hook.
 *
 * SECURITY: Validates the Supabase session server-side and only
 * returns RBAC data for the authenticated user — never for others.
 * 
 * PERFORMANCE: Sets Cache-Control to allow short browser caching (10s)
 * so rapid navigations between admin pages don't re-trigger this endpoint.
 */
export async function GET(request: NextRequest) {
  try {
    // ── Authenticate via Supabase session (server-side) ──
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUserId = authUser.id;

    // Get local user ID from authenticated Supabase user ID
    const localUser = await db
      .select({ id: user.id, defaultRole: user.defaultRole })
      .from(user)
      .where(eq(user.supabaseUserId, supabaseUserId))
      .limit(1);

    if (localUser.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const localUserId = localUser[0].id;

    const userPermissions = await getUserPermissionsWithFallback(localUserId);
    const roles = userPermissions.roles;
    const permissions = userPermissions.permissions;

    const response = NextResponse.json({
      localUserId,
      roles,
      permissions,
    });

    // Allow the browser to cache this response for 10 seconds.
    // This prevents re-fetching RBAC on every admin sub-page navigation
    // while still ensuring changes propagate within a reasonable window.
    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');

    return response;
  } catch (error) {
    console.error('[get-user-rbac] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
