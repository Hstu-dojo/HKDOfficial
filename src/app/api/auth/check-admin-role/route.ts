import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user, userRole, role } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * API endpoint to check if a user has admin-level roles
 * Called from middleware (Edge Runtime can't do direct DB queries)
 */
export async function GET(request: NextRequest) {
  try {
    const supabaseUserId = request.headers.get('x-supabase-user-id');
    
    if (!supabaseUserId) {
      return NextResponse.json({ hasAdminRole: false, error: 'No user ID provided' }, { status: 400 });
    }

    // Get local user ID from Supabase user ID
    const localUser = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.supabaseUserId, supabaseUserId))
      .limit(1);

    if (localUser.length === 0) {
      return NextResponse.json({ hasAdminRole: false, error: 'User not found' }, { status: 404 });
    }

    // Check if user has admin-level roles
    const userRoles = await db
      .select({
        roleName: role.name,
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .where(
        and(
          eq(userRole.userId, localUser[0].id),
          eq(userRole.isActive, true),
          eq(role.isActive, true)
        )
      );

    // Check if user has any admin-level role
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'INSTRUCTOR'];
    const hasAdminRole = userRoles.some(ur => adminRoles.includes(ur.roleName));
    const roles = userRoles.map(ur => ur.roleName);

    return NextResponse.json({ 
      hasAdminRole, 
      roles,
      localUserId: localUser[0].id 
    });
  } catch (error) {
    console.error('[check-admin-role] Error:', error);
    return NextResponse.json({ hasAdminRole: false, error: 'Internal error' }, { status: 500 });
  }
}
