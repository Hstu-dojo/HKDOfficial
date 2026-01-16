import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user, userRole, role, rolePermission, permission } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';

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

    // Get user's roles from userRole table
    const userRoles = await db
      .select({
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive,
        },
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .where(
        and(
          eq(userRole.userId, localUserId),
          eq(userRole.isActive, true),
          eq(role.isActive, true)
        )
      );

    console.log('[get-user-rbac] User roles from userRole table:', userRoles.map(ur => ur.role.name));

    let roles = userRoles.map(ur => ur.role);
    let permissions: any[] = [];

    // If user has roles, get their permissions
    if (roles.length > 0) {
      const roleIds = roles.map(r => r.id);

      // Get permissions for these roles
      const rolePerms = await db
        .select({
          permission: {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
          },
        })
        .from(rolePermission)
        .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
        .where(inArray(rolePermission.roleId, roleIds));

      // Remove duplicates
      const permMap = new Map();
      rolePerms.forEach(rp => {
        if (!permMap.has(rp.permission.id)) {
          permMap.set(rp.permission.id, rp.permission);
        }
      });
      permissions = Array.from(permMap.values());
    } else if (defaultRole) {
      // Fallback: If no userRole entries, check defaultRole
      console.log('[get-user-rbac] No userRole entries, falling back to defaultRole:', defaultRole);
      
      const defaultRoleData = await db
        .select({
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive,
        })
        .from(role)
        .where(eq(role.name, defaultRole))
        .limit(1);

      if (defaultRoleData.length > 0 && defaultRoleData[0].isActive) {
        roles = [defaultRoleData[0]];

        // Get permissions for this role
        const rolePerms = await db
          .select({
            permission: {
              id: permission.id,
              name: permission.name,
              description: permission.description,
              resource: permission.resource,
              action: permission.action,
            },
          })
          .from(rolePermission)
          .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
          .where(eq(rolePermission.roleId, defaultRoleData[0].id));

        permissions = rolePerms.map(rp => rp.permission);
      }
    }

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
