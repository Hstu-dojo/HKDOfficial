import { db } from "@/lib/connect-db";
import { role, permission, rolePermission, userRole, user } from "@/db/schema";
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
 * Get user permissions with fallback to defaultRole from user table
 * This handles the case where a user has a defaultRole but no explicit userRole assignment
 */
export async function getUserPermissionsWithFallback(userId: string): Promise<UserPermissions> {
  try {
    // First try to get permissions from the userRole table
    const permissions = await getUserPermissions(userId);
    
    // If user has roles assigned in userRole table, return those
    if (permissions.roles.length > 0) {
      return permissions;
    }
    
    // Fallback: Check user's defaultRole field
    const userData = await db
      .select({ defaultRole: user.defaultRole })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    
    if (userData.length === 0 || !userData[0].defaultRole) {
      return { userId, roles: [], permissions: [] };
    }
    
    const defaultRoleName = userData[0].defaultRole;
    
    // Find the role in the role table
    const roleData = await db
      .select({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
      })
      .from(role)
      .where(eq(role.name, defaultRoleName))
      .limit(1);
    
    if (roleData.length === 0 || !roleData[0].isActive) {
      // Role doesn't exist in RBAC system yet, but user has defaultRole
      // Return a minimal role object
      return {
        userId,
        roles: [{
          id: 'default',
          name: defaultRoleName,
          description: `Default role from user profile`,
          isActive: true,
        }],
        permissions: [],
      };
    }
    
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
      .where(eq(rolePermission.roleId, roleData[0].id));
    
    const uniquePermissions = rolePerms.map(rp => rp.permission);
    
    return {
      userId,
      roles: [roleData[0]],
      permissions: uniquePermissions,
    };
  } catch (error) {
    console.error("Error getting user permissions with fallback:", error);
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

/**
 * Get all permissions for a specific role
 */
export async function getRolePermissions(roleId: string): Promise<Permission[]> {
  try {
    const rolePerms = await db
      .select({
        id: permission.id,
        name: permission.name,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
      })
      .from(rolePermission)
      .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
      .where(eq(rolePermission.roleId, roleId));
    
    return rolePerms;
  } catch (error) {
    console.error("Error getting role permissions:", error);
    return [];
  }
}

/**
 * Update a role
 */
export async function updateRole(
  roleId: string, 
  data: { name?: string; description?: string; isActive?: boolean }
): Promise<boolean> {
  try {
    await db.update(role)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(role.id, roleId));
    return true;
  } catch (error) {
    console.error("Error updating role:", error);
    return false;
  }
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string): Promise<boolean> {
  try {
    // First remove all role permissions
    await db.delete(rolePermission).where(eq(rolePermission.roleId, roleId));
    // Then remove all user role assignments
    await db.delete(userRole).where(eq(userRole.roleId, roleId));
    // Finally delete the role
    await db.delete(role).where(eq(role.id, roleId));
    return true;
  } catch (error) {
    console.error("Error deleting role:", error);
    return false;
  }
}

/**
 * Update a permission
 */
export async function updatePermission(
  permissionId: string, 
  data: { name?: string; description?: string; resource?: ResourceType; action?: ActionType }
): Promise<boolean> {
  try {
    await db.update(permission)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(permission.id, permissionId));
    return true;
  } catch (error) {
    console.error("Error updating permission:", error);
    return false;
  }
}

/**
 * Delete a permission
 */
export async function deletePermission(permissionId: string): Promise<boolean> {
  try {
    // First remove all role permission assignments
    await db.delete(rolePermission).where(eq(rolePermission.permissionId, permissionId));
    // Then delete the permission
    await db.delete(permission).where(eq(permission.id, permissionId));
    return true;
  } catch (error) {
    console.error("Error deleting permission:", error);
    return false;
  }
}

/**
 * Get all users with their roles
 */
export async function getAllUsersWithRoles(): Promise<any[]> {
  try {
    const users = await db.query.user.findMany({
      with: {
        userRoles: {
          with: {
            role: true
          }
        }
      }
    });
    return users;
  } catch (error) {
    console.error("Error getting all users with roles:", error);
    return [];
  }
}

/**
 * Get role by ID
 */
export async function getRoleById(roleId: string): Promise<Role | null> {
  try {
    const [foundRole] = await db.select().from(role).where(eq(role.id, roleId)).limit(1);
    return foundRole || null;
  } catch (error) {
    console.error("Error getting role by ID:", error);
    return null;
  }
}

/**
 * Get permission by ID
 */
export async function getPermissionById(permissionId: string): Promise<Permission | null> {
  try {
    const [foundPermission] = await db.select().from(permission).where(eq(permission.id, permissionId)).limit(1);
    return foundPermission || null;
  } catch (error) {
    console.error("Error getting permission by ID:", error);
    return null;
  }
}

/**
 * Get role by name
 */
export async function getRoleByName(roleName: string): Promise<Role | null> {
  try {
    const [foundRole] = await db.select().from(role).where(eq(role.name, roleName)).limit(1);
    return foundRole || null;
  } catch (error) {
    console.error("Error getting role by name:", error);
    return null;
  }
}

/**
 * Get all user role assignments
 */
export async function getUserRoleAssignments(userId: string): Promise<any[]> {
  try {
    const assignments = await db
      .select({
        id: userRole.id,
        roleId: userRole.roleId,
        roleName: role.name,
        roleDescription: role.description,
        assignedAt: userRole.assignedAt,
        assignedBy: userRole.assignedBy,
        isActive: userRole.isActive
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .where(eq(userRole.userId, userId));
    return assignments;
  } catch (error) {
    console.error("Error getting user role assignments:", error);
    return [];
  }
}

/**
 * Bulk assign permissions to a role
 */
export async function bulkAssignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<boolean> {
  try {
    const values = permissionIds.map(permissionId => ({
      roleId,
      permissionId
    }));
    
    if (values.length > 0) {
      await db.insert(rolePermission).values(values).onConflictDoNothing();
    }
    return true;
  } catch (error) {
    console.error("Error bulk assigning permissions to role:", error);
    return false;
  }
}

/**
 * Bulk remove permissions from a role
 */
export async function bulkRemovePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<boolean> {
  try {
    for (const permissionId of permissionIds) {
      await db.delete(rolePermission).where(
        and(eq(rolePermission.roleId, roleId), eq(rolePermission.permissionId, permissionId))
      );
    }
    return true;
  } catch (error) {
    console.error("Error bulk removing permissions from role:", error);
    return false;
  }
}
