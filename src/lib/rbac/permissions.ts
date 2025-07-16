import { db } from "@/lib/connect-db";
import { role, permission, rolePermission, userRole } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type { ResourceType, ActionType, Permission, Role, UserPermissions } from "./types";

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  try {
    // Get user's roles
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
      .where(and(eq(userRole.userId, userId), eq(userRole.isActive, true), eq(role.isActive, true)));

    if (userRoles.length === 0) {
      return { userId, roles: [], permissions: [] };
    }

    const roleIds = userRoles.map((ur) => ur.role.id);

    // Get permissions for these roles
    const rolePermissions = await db
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

    // Remove duplicates and format
    const uniquePermissions = rolePermissions.reduce((acc, rp) => {
      if (!acc.find((p) => p.id === rp.permission.id)) {
        acc.push(rp.permission);
      }
      return acc;
    }, [] as Permission[]);

    return {
      userId,
      roles: userRoles.map((ur) => ur.role),
      permissions: uniquePermissions,
    };
  } catch (error) {
    console.error("Error getting user permissions:", error);
    return { userId, roles: [], permissions: [] };
  }
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(
  userId: string,
  resource: ResourceType,
  action: ActionType
): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(userId);
    
    return userPermissions.permissions.some(
      (p) => p.resource === resource && (p.action === action || p.action === "MANAGE")
    );
  } catch (error) {
    console.error("Error checking permission:", error);
    return false;
  }
}

/**
 * Check if a user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(userId);
    return userPermissions.roles.some((r) => r.name === roleName);
  } catch (error) {
    console.error("Error checking role:", error);
    return false;
  }
}

/**
 * Assign a role to a user
 */
export async function assignRole(userId: string, roleId: string, assignedBy?: string): Promise<boolean> {
  try {
    await db.insert(userRole).values({
      userId,
      roleId,
      assignedBy,
      isActive: true,
    });
    return true;
  } catch (error) {
    console.error("Error assigning role:", error);
    return false;
  }
}

/**
 * Remove a role from a user
 */
export async function removeRole(userId: string, roleId: string): Promise<boolean> {
  try {
    await db
      .update(userRole)
      .set({ isActive: false })
      .where(and(eq(userRole.userId, userId), eq(userRole.roleId, roleId)));
    return true;
  } catch (error) {
    console.error("Error removing role:", error);
    return false;
  }
}

/**
 * Create a new role
 */
export async function createRole(name: string, description?: string): Promise<string | null> {
  try {
    const [newRole] = await db.insert(role).values({
      name,
      description,
      isActive: true,
    }).returning({ id: role.id });
    
    return newRole.id;
  } catch (error) {
    console.error("Error creating role:", error);
    return null;
  }
}

/**
 * Create a new permission
 */
export async function createPermission(
  name: string,
  resource: ResourceType,
  action: ActionType,
  description?: string
): Promise<string | null> {
  try {
    const [newPermission] = await db.insert(permission).values({
      name,
      resource,
      action,
      description,
    }).returning({ id: permission.id });
    
    return newPermission.id;
  } catch (error) {
    console.error("Error creating permission:", error);
    return null;
  }
}

/**
 * Assign a permission to a role
 */
export async function assignPermissionToRole(roleId: string, permissionId: string): Promise<boolean> {
  try {
    await db.insert(rolePermission).values({
      roleId,
      permissionId,
    });
    return true;
  } catch (error) {
    console.error("Error assigning permission to role:", error);
    return false;
  }
}

/**
 * Remove a permission from a role
 */
export async function removePermissionFromRole(roleId: string, permissionId: string): Promise<boolean> {
  try {
    await db.delete(rolePermission).where(
      and(eq(rolePermission.roleId, roleId), eq(rolePermission.permissionId, permissionId))
    );
    return true;
  } catch (error) {
    console.error("Error removing permission from role:", error);
    return false;
  }
}

/**
 * Get all roles
 */
export async function getAllRoles(): Promise<Role[]> {
  try {
    const roles = await db.select().from(role).where(eq(role.isActive, true));
    return roles;
  } catch (error) {
    console.error("Error getting all roles:", error);
    return [];
  }
}

/**
 * Get all permissions
 */
export async function getAllPermissions(): Promise<Permission[]> {
  try {
    const permissions = await db.select().from(permission);
    return permissions;
  } catch (error) {
    console.error("Error getting all permissions:", error);
    return [];
  }
}
