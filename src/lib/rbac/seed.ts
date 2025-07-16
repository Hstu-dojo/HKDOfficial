import { db } from "@/lib/connect-db";
import { role, permission, rolePermission } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createRole, createPermission, assignPermissionToRole } from "./permissions";
import type { ResourceType, ActionType } from "./types";

// Default roles
const defaultRoles = [
  { name: "SUPER_ADMIN", description: "Super administrator with full access" },
  { name: "ADMIN", description: "Administrator with management access" },
  { name: "MODERATOR", description: "Moderator with limited management access" },
  { name: "INSTRUCTOR", description: "Instructor with course management access" },
  { name: "MEMBER", description: "Regular member with basic access" },
  { name: "GUEST", description: "Guest user with read-only access" },
];

// Default permissions
const defaultPermissions: Array<{
  name: string;
  resource: ResourceType;
  action: ActionType;
  description?: string;
}> = [
  // User permissions
  { name: "create_user", resource: "USER", action: "CREATE", description: "Create new users" },
  { name: "read_user", resource: "USER", action: "READ", description: "View user information" },
  { name: "update_user", resource: "USER", action: "UPDATE", description: "Update user information" },
  { name: "delete_user", resource: "USER", action: "DELETE", description: "Delete users" },
  { name: "manage_user", resource: "USER", action: "MANAGE", description: "Full user management" },
  
  // Account permissions
  { name: "create_account", resource: "ACCOUNT", action: "CREATE", description: "Create new accounts" },
  { name: "read_account", resource: "ACCOUNT", action: "READ", description: "View account information" },
  { name: "update_account", resource: "ACCOUNT", action: "UPDATE", description: "Update account information" },
  { name: "delete_account", resource: "ACCOUNT", action: "DELETE", description: "Delete accounts" },
  { name: "manage_account", resource: "ACCOUNT", action: "MANAGE", description: "Full account management" },
  
  // Role permissions
  { name: "create_role", resource: "ROLE", action: "CREATE", description: "Create new roles" },
  { name: "read_role", resource: "ROLE", action: "READ", description: "View roles" },
  { name: "update_role", resource: "ROLE", action: "UPDATE", description: "Update roles" },
  { name: "delete_role", resource: "ROLE", action: "DELETE", description: "Delete roles" },
  { name: "manage_role", resource: "ROLE", action: "MANAGE", description: "Full role management" },
  
  // Permission permissions
  { name: "create_permission", resource: "PERMISSION", action: "CREATE", description: "Create new permissions" },
  { name: "read_permission", resource: "PERMISSION", action: "READ", description: "View permissions" },
  { name: "update_permission", resource: "PERMISSION", action: "UPDATE", description: "Update permissions" },
  { name: "delete_permission", resource: "PERMISSION", action: "DELETE", description: "Delete permissions" },
  { name: "manage_permission", resource: "PERMISSION", action: "MANAGE", description: "Full permission management" },
  
  // Course permissions (for future use)
  { name: "create_course", resource: "COURSE", action: "CREATE", description: "Create new courses" },
  { name: "read_course", resource: "COURSE", action: "READ", description: "View courses" },
  { name: "update_course", resource: "COURSE", action: "UPDATE", description: "Update courses" },
  { name: "delete_course", resource: "COURSE", action: "DELETE", description: "Delete courses" },
  { name: "manage_course", resource: "COURSE", action: "MANAGE", description: "Full course management" },
  
  // Blog permissions (for future use)
  { name: "create_blog", resource: "BLOG", action: "CREATE", description: "Create new blog posts" },
  { name: "read_blog", resource: "BLOG", action: "READ", description: "View blog posts" },
  { name: "update_blog", resource: "BLOG", action: "UPDATE", description: "Update blog posts" },
  { name: "delete_blog", resource: "BLOG", action: "DELETE", description: "Delete blog posts" },
  { name: "manage_blog", resource: "BLOG", action: "MANAGE", description: "Full blog management" },
  
  // Media permissions (for future use)
  { name: "create_media", resource: "MEDIA", action: "CREATE", description: "Upload media files" },
  { name: "read_media", resource: "MEDIA", action: "READ", description: "View media files" },
  { name: "update_media", resource: "MEDIA", action: "UPDATE", description: "Update media files" },
  { name: "delete_media", resource: "MEDIA", action: "DELETE", description: "Delete media files" },
  { name: "manage_media", resource: "MEDIA", action: "MANAGE", description: "Full media management" },
];

// Role-Permission mappings
const rolePermissionMappings = {
  SUPER_ADMIN: [
    "manage_user", "manage_account", "manage_role", "manage_permission",
    "manage_course", "manage_blog", "manage_media"
  ],
  ADMIN: [
    "create_user", "read_user", "update_user", "delete_user",
    "create_account", "read_account", "update_account", "delete_account",
    "read_role", "read_permission",
    "manage_course", "manage_blog", "manage_media"
  ],
  MODERATOR: [
    "read_user", "update_user",
    "read_account", "update_account",
    "read_role", "read_permission",
    "create_course", "read_course", "update_course",
    "create_blog", "read_blog", "update_blog",
    "create_media", "read_media", "update_media"
  ],
  INSTRUCTOR: [
    "read_user", "read_account",
    "create_course", "read_course", "update_course",
    "create_blog", "read_blog", "update_blog",
    "create_media", "read_media", "update_media"
  ],
  MEMBER: [
    "read_user", "read_account",
    "read_course", "read_blog", "read_media"
  ],
  GUEST: [
    "read_course", "read_blog", "read_media"
  ]
};

export async function seedRBACData() {
  try {
    console.log("Starting RBAC data seeding...");
    
    // Create roles
    const createdRoles: Record<string, string> = {};
    
    for (const roleData of defaultRoles) {
      const existingRole = await db.select().from(role).where(eq(role.name, roleData.name)).limit(1);
      
      if (existingRole.length === 0) {
        const roleId = await createRole(roleData.name, roleData.description);
        if (roleId) {
          createdRoles[roleData.name] = roleId;
          console.log(`Created role: ${roleData.name}`);
        }
      } else {
        createdRoles[roleData.name] = existingRole[0].id;
        console.log(`Role already exists: ${roleData.name}`);
      }
    }
    
    // Create permissions
    const createdPermissions: Record<string, string> = {};
    
    for (const permData of defaultPermissions) {
      const existingPermission = await db.select().from(permission).where(eq(permission.name, permData.name)).limit(1);
      
      if (existingPermission.length === 0) {
        const permId = await createPermission(permData.name, permData.resource, permData.action, permData.description);
        if (permId) {
          createdPermissions[permData.name] = permId;
          console.log(`Created permission: ${permData.name}`);
        }
      } else {
        createdPermissions[permData.name] = existingPermission[0].id;
        console.log(`Permission already exists: ${permData.name}`);
      }
    }
    
    // Assign permissions to roles
    for (const [roleName, permissionNames] of Object.entries(rolePermissionMappings)) {
      const roleId = createdRoles[roleName];
      
      if (roleId) {
        for (const permName of permissionNames) {
          const permId = createdPermissions[permName];
          
          if (permId) {
            // Check if assignment already exists
            const existingAssignment = await db.select()
              .from(rolePermission)
              .where(and(eq(rolePermission.roleId, roleId), eq(rolePermission.permissionId, permId)))
              .limit(1);
            
            if (existingAssignment.length === 0) {
              await assignPermissionToRole(roleId, permId);
              console.log(`Assigned permission ${permName} to role ${roleName}`);
            }
          }
        }
      }
    }
    
    console.log("RBAC data seeding completed successfully!");
    
  } catch (error) {
    console.error("Error seeding RBAC data:", error);
    throw error;
  }
}

// Helper function to run seeding
export async function runRBACSeeding() {
  try {
    await seedRBACData();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
}
