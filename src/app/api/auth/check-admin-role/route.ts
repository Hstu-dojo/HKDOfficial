import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user, userRole, role } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * API endpoint to check if a user has admin-level roles
 * Called from middleware (Edge Runtime can't do direct DB queries)
 * Checks both userRole table and user.defaultRole as fallback
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

    // Define admin-level roles
    const adminRoles = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'INSTRUCTOR'];

    // Check if user has admin-level roles in userRole table
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

    // Roles from userRole table
    const assignedRoles = userRoles.map(ur => ur.roleName);
    
    // Check both assigned roles AND defaultRole as fallback
    const hasAdminRoleFromAssignments = assignedRoles.some(roleName => adminRoles.includes(roleName));
    const hasAdminRoleFromDefault = localUser[0].defaultRole && adminRoles.includes(localUser[0].defaultRole);
    const hasAdminRole = hasAdminRoleFromAssignments || hasAdminRoleFromDefault;
    
    // Combine roles (include defaultRole if it's an admin role and not already in assignedRoles)
    const roles = [...assignedRoles];
    if (localUser[0].defaultRole && !roles.includes(localUser[0].defaultRole)) {
      roles.push(localUser[0].defaultRole);
    }

    return NextResponse.json({ 
      hasAdminRole, 
      roles,
      localUserId: localUser[0].id,
      defaultRole: localUser[0].defaultRole,
    });
  } catch (error) {
    console.error('[check-admin-role] Error:', error);
    return NextResponse.json({ hasAdminRole: false, error: 'Internal error' }, { status: 500 });
  }
}
