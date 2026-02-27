import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user, userRole, role, rolePermission, permission } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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

    // Get user's assigned roles
    const userRoles = await db
      .select({
        roleId: role.id,
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

    const assignedRoles = userRoles.map(ur => ur.roleName);
    const assignedRoleIds = userRoles.map(ur => ur.roleId);

    // Check if any assigned role has ADMIN_PANEL:ACCESS permission
    let hasAdminAccess = false;

    if (assignedRoleIds.length > 0) {
      const adminPermCheck = await db
        .select({ permId: permission.id })
        .from(rolePermission)
        .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
        .where(
          and(
            eq(permission.resource, 'ADMIN_PANEL'),
            eq(permission.action, 'ACCESS')
          )
        )
        .limit(1);

      if (adminPermCheck.length > 0) {
        // Check if any of the user's roles have this permission
        for (const roleId of assignedRoleIds) {
          const hasIt = await db
            .select({ id: rolePermission.id })
            .from(rolePermission)
            .where(
              and(
                eq(rolePermission.roleId, roleId),
                eq(rolePermission.permissionId, adminPermCheck[0].permId)
              )
            )
            .limit(1);
          if (hasIt.length > 0) {
            hasAdminAccess = true;
            break;
          }
        }
      }
    }

    // Fallback: check defaultRole if no explicit userRole assignments grant access
    if (!hasAdminAccess && localUser[0].defaultRole) {
      const defaultRoleData = await db
        .select({ id: role.id })
        .from(role)
        .where(and(eq(role.name, localUser[0].defaultRole), eq(role.isActive, true)))
        .limit(1);

      if (defaultRoleData.length > 0) {
        const defaultRolePerms = await db
          .select({ permId: permission.id })
          .from(rolePermission)
          .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
          .where(
            and(
              eq(rolePermission.roleId, defaultRoleData[0].id),
              eq(permission.resource, 'ADMIN_PANEL'),
              eq(permission.action, 'ACCESS')
            )
          )
          .limit(1);

        if (defaultRolePerms.length > 0) {
          hasAdminAccess = true;
        }
      }
    }

    // Combine roles (include defaultRole if not already in assignedRoles)
    const roles = [...assignedRoles];
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
