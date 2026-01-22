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
  { name: "STUDENT", description: "Student with learning access" },
  { name: "USER", description: "Regular user with basic access" },
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
  
  // Karate-specific permissions
  // Class permissions
  { name: "create_class", resource: "CLASS", action: "CREATE", description: "Create new classes" },
  { name: "read_class", resource: "CLASS", action: "READ", description: "View classes" },
  { name: "update_class", resource: "CLASS", action: "UPDATE", description: "Update classes" },
  { name: "delete_class", resource: "CLASS", action: "DELETE", description: "Delete classes" },
  { name: "manage_class", resource: "CLASS", action: "MANAGE", description: "Full class management" },
  
  // Equipment permissions
  { name: "create_equipment", resource: "EQUIPMENT", action: "CREATE", description: "Create new equipment" },
  { name: "read_equipment", resource: "EQUIPMENT", action: "READ", description: "View equipment" },
  { name: "update_equipment", resource: "EQUIPMENT", action: "UPDATE", description: "Update equipment" },
  { name: "delete_equipment", resource: "EQUIPMENT", action: "DELETE", description: "Delete equipment" },
  { name: "manage_equipment", resource: "EQUIPMENT", action: "MANAGE", description: "Full equipment management" },
  
  // Member permissions
  { name: "create_member", resource: "MEMBER", action: "CREATE", description: "Create new members" },
  { name: "read_member", resource: "MEMBER", action: "READ", description: "View members" },
  { name: "update_member", resource: "MEMBER", action: "UPDATE", description: "Update members" },
  { name: "delete_member", resource: "MEMBER", action: "DELETE", description: "Delete members" },
  { name: "manage_member", resource: "MEMBER", action: "MANAGE", description: "Full member management" },
  
  // Bill permissions
  { name: "create_bill", resource: "BILL", action: "CREATE", description: "Create new bills" },
  { name: "read_bill", resource: "BILL", action: "READ", description: "View bills" },
  { name: "update_bill", resource: "BILL", action: "UPDATE", description: "Update bills" },
  { name: "delete_bill", resource: "BILL", action: "DELETE", description: "Delete bills" },
  { name: "manage_bill", resource: "BILL", action: "MANAGE", description: "Full bill management" },
  
  // Payment permissions
  { name: "create_payment", resource: "PAYMENT", action: "CREATE", description: "Create new payments" },
  { name: "read_payment", resource: "PAYMENT", action: "READ", description: "View payments" },
  { name: "update_payment", resource: "PAYMENT", action: "UPDATE", description: "Update payments" },
  { name: "delete_payment", resource: "PAYMENT", action: "DELETE", description: "Delete payments" },
  { name: "manage_payment", resource: "PAYMENT", action: "MANAGE", description: "Full payment management" },
  
  // Gallery permissions
  { name: "create_gallery", resource: "GALLERY", action: "CREATE", description: "Create new galleries" },
  { name: "read_gallery", resource: "GALLERY", action: "READ", description: "View galleries" },
  { name: "update_gallery", resource: "GALLERY", action: "UPDATE", description: "Update galleries" },
  { name: "delete_gallery", resource: "GALLERY", action: "DELETE", description: "Delete galleries" },
  { name: "manage_gallery", resource: "GALLERY", action: "MANAGE", description: "Full gallery management" },
  
  // Event permissions
  { name: "create_event", resource: "EVENT", action: "CREATE", description: "Create new events" },
  { name: "read_event", resource: "EVENT", action: "READ", description: "View events" },
  { name: "update_event", resource: "EVENT", action: "UPDATE", description: "Update events" },
  { name: "delete_event", resource: "EVENT", action: "DELETE", description: "Delete events" },
  { name: "manage_event", resource: "EVENT", action: "MANAGE", description: "Full event management" },
  
  // Announcement permissions
  { name: "create_announcement", resource: "ANNOUNCEMENT", action: "CREATE", description: "Create new announcements" },
  { name: "read_announcement", resource: "ANNOUNCEMENT", action: "READ", description: "View announcements" },
  { name: "update_announcement", resource: "ANNOUNCEMENT", action: "UPDATE", description: "Update announcements" },
  { name: "delete_announcement", resource: "ANNOUNCEMENT", action: "DELETE", description: "Delete announcements" },
  { name: "manage_announcement", resource: "ANNOUNCEMENT", action: "MANAGE", description: "Full announcement management" },
  
  // Certificate permissions
  { name: "create_certificate", resource: "CERTIFICATE", action: "CREATE", description: "Create new certificates" },
  { name: "read_certificate", resource: "CERTIFICATE", action: "READ", description: "View certificates" },
  { name: "update_certificate", resource: "CERTIFICATE", action: "UPDATE", description: "Update certificates" },
  { name: "delete_certificate", resource: "CERTIFICATE", action: "DELETE", description: "Delete certificates" },
  { name: "manage_certificate", resource: "CERTIFICATE", action: "MANAGE", description: "Full certificate management" },
  
  // Report permissions
  { name: "create_report", resource: "REPORT", action: "CREATE", description: "Create new reports" },
  { name: "read_report", resource: "REPORT", action: "READ", description: "View reports" },
  { name: "update_report", resource: "REPORT", action: "UPDATE", description: "Update reports" },
  { name: "delete_report", resource: "REPORT", action: "DELETE", description: "Delete reports" },
  { name: "manage_report", resource: "REPORT", action: "MANAGE", description: "Full report management" },
  
  // Enrollment permissions
  { name: "create_enrollment", resource: "ENROLLMENT", action: "CREATE", description: "Create new enrollments" },
  { name: "read_enrollment", resource: "ENROLLMENT", action: "READ", description: "View enrollments" },
  { name: "update_enrollment", resource: "ENROLLMENT", action: "UPDATE", description: "Update enrollments" },
  { name: "delete_enrollment", resource: "ENROLLMENT", action: "DELETE", description: "Delete enrollments" },
  { name: "manage_enrollment", resource: "ENROLLMENT", action: "MANAGE", description: "Full enrollment management" },
  { name: "approve_enrollment", resource: "ENROLLMENT", action: "APPROVE", description: "Approve/reject enrollment applications" },
  { name: "verify_enrollment", resource: "ENROLLMENT", action: "VERIFY", description: "Verify enrollment payments" },
  
  // Monthly Fee permissions
  { name: "create_monthly_fee", resource: "MONTHLY_FEE", action: "CREATE", description: "Create monthly fee records" },
  { name: "read_monthly_fee", resource: "MONTHLY_FEE", action: "READ", description: "View monthly fees" },
  { name: "update_monthly_fee", resource: "MONTHLY_FEE", action: "UPDATE", description: "Update monthly fees" },
  { name: "delete_monthly_fee", resource: "MONTHLY_FEE", action: "DELETE", description: "Delete monthly fees" },
  { name: "manage_monthly_fee", resource: "MONTHLY_FEE", action: "MANAGE", description: "Full monthly fee management" },
  { name: "verify_monthly_fee", resource: "MONTHLY_FEE", action: "VERIFY", description: "Verify monthly fee payments" },
  
  // Schedule permissions
  { name: "create_schedule", resource: "SCHEDULE", action: "CREATE", description: "Create schedules" },
  { name: "read_schedule", resource: "SCHEDULE", action: "READ", description: "View schedules" },
  { name: "update_schedule", resource: "SCHEDULE", action: "UPDATE", description: "Update schedules" },
  { name: "delete_schedule", resource: "SCHEDULE", action: "DELETE", description: "Delete schedules" },
  { name: "manage_schedule", resource: "SCHEDULE", action: "MANAGE", description: "Full schedule management" },
  // Program permissions
  { name: "create_program", resource: "PROGRAM", action: "CREATE", description: "Create programs" },
  { name: "read_program", resource: "PROGRAM", action: "READ", description: "View programs" },
  { name: "update_program", resource: "PROGRAM", action: "UPDATE", description: "Update programs" },
  { name: "delete_program", resource: "PROGRAM", action: "DELETE", description: "Delete programs" },
  { name: "manage_program", resource: "PROGRAM", action: "MANAGE", description: "Manage programs" },

  // Program Registration permissions
  { name: "create_program_registration", resource: "PROGRAM_REGISTRATION", action: "CREATE", description: "Register for programs" },
  { name: "read_program_registration", resource: "PROGRAM_REGISTRATION", action: "READ", description: "View program registrations" },
  { name: "update_program_registration", resource: "PROGRAM_REGISTRATION", action: "UPDATE", description: "Update program registrations" },
  { name: "delete_program_registration", resource: "PROGRAM_REGISTRATION", action: "DELETE", description: "Delete program registrations" },
  { name: "manage_program_registration", resource: "PROGRAM_REGISTRATION", action: "MANAGE", description: "Manage program registrations" },
  { name: "approve_program_registration", resource: "PROGRAM_REGISTRATION", action: "APPROVE", description: "Approve program registrations" },
  { name: "verify_program_registration", resource: "PROGRAM_REGISTRATION", action: "VERIFY", description: "Verify program payments" },];

// Role-Permission mappings
const rolePermissionMappings: { [key: string]: string[] } = {
  SUPER_ADMIN: [
    // All permissions
    "create_user", "read_user", "update_user", "delete_user", "manage_user",
    "create_account", "read_account", "update_account", "delete_account", "manage_account",
    "create_role", "read_role", "update_role", "delete_role", "manage_role",
    "create_permission", "read_permission", "update_permission", "delete_permission", "manage_permission",
    "create_course", "read_course", "update_course", "delete_course", "manage_course",
    "create_blog", "read_blog", "update_blog", "delete_blog", "manage_blog",
    "create_media", "read_media", "update_media", "delete_media", "manage_media",
    // Karate permissions
    "create_class", "read_class", "update_class", "delete_class", "manage_class",
    "create_equipment", "read_equipment", "update_equipment", "delete_equipment", "manage_equipment",
    "create_member", "read_member", "update_member", "delete_member", "manage_member",
    "create_bill", "read_bill", "update_bill", "delete_bill", "manage_bill",
    "create_payment", "read_payment", "update_payment", "delete_payment", "manage_payment",
    // New resource permissions
    "create_gallery", "read_gallery", "update_gallery", "delete_gallery", "manage_gallery",
    "create_event", "read_event", "update_event", "delete_event", "manage_event",
    "create_announcement", "read_announcement", "update_announcement", "delete_announcement", "manage_announcement",
    "create_certificate", "read_certificate", "update_certificate", "delete_certificate", "manage_certificate",
    "create_report", "read_report", "update_report", "delete_report", "manage_report",
    // Enrollment permissions
    "create_enrollment", "read_enrollment", "update_enrollment", "delete_enrollment", "manage_enrollment", "approve_enrollment", "verify_enrollment",
    // Monthly Fee permissions
    "create_monthly_fee", "read_monthly_fee", "update_monthly_fee", "delete_monthly_fee", "manage_monthly_fee", "verify_monthly_fee",
    // Schedule permissions
    "create_schedule", "read_schedule", "update_schedule", "delete_schedule", "manage_schedule",
  ],
  ADMIN: [
    // Most permissions except system-level ones
    "read_user", "update_user", "delete_user",
    "read_account", "update_account",
    "read_role",
    "read_permission",
    "create_course", "read_course", "update_course", "delete_course", "manage_course",
    "create_blog", "read_blog", "update_blog", "delete_blog", "manage_blog",
    "create_media", "read_media", "update_media", "delete_media", "manage_media",
    // Karate management permissions
    "create_class", "read_class", "update_class", "delete_class", "manage_class",
    "create_equipment", "read_equipment", "update_equipment", "delete_equipment", "manage_equipment",
    "create_member", "read_member", "update_member", "delete_member", "manage_member",
    "create_bill", "read_bill", "update_bill", "delete_bill", "manage_bill",
    "create_payment", "read_payment", "update_payment", "delete_payment", "manage_payment",
    // New resource permissions
    "create_gallery", "read_gallery", "update_gallery", "delete_gallery", "manage_gallery",
    "create_event", "read_event", "update_event", "delete_event", "manage_event",
    "create_announcement", "read_announcement", "update_announcement", "delete_announcement", "manage_announcement",
    "create_certificate", "read_certificate", "update_certificate", "delete_certificate", "manage_certificate",
    "read_report", "create_report",
    // Enrollment permissions for admin
    "create_enrollment", "read_enrollment", "update_enrollment", "delete_enrollment", "manage_enrollment", "approve_enrollment", "verify_enrollment",
    // Monthly Fee permissions for admin
    "create_monthly_fee", "read_monthly_fee", "update_monthly_fee", "delete_monthly_fee", "manage_monthly_fee", "verify_monthly_fee",
    // Schedule permissions for admin
    "create_schedule", "read_schedule", "update_schedule", "delete_schedule", "manage_schedule",
    // Program permissions for admin
    "create_program", "read_program", "update_program", "delete_program", "manage_program", 
    // Program Registration permissions for admin
    "read_program_registration", "update_program_registration", "delete_program_registration", "manage_program_registration", "approve_program_registration", "verify_program_registration",
  ],
  MODERATOR: [
    // Content moderation permissions
    "read_user",
    "read_blog", "update_blog",
    "read_media", "update_media", "delete_media",
    "read_gallery", "update_gallery",
    "read_event", "update_event",
    "read_announcement", "create_announcement", "update_announcement",
    "read_member",
    "read_class",
    // Enrollment review permissions for moderator
    "read_enrollment", "approve_enrollment", "verify_enrollment",
    // Monthly Fee verification for moderator
    "read_monthly_fee", "verify_monthly_fee",
    // Schedule view
    "read_schedule",
    // Program permissions for moderator
    "read_program",
    // Program Registration permissions for moderator
    "read_program_registration", "approve_program_registration", "verify_program_registration",
  ],
  INSTRUCTOR: [
    // Teaching-related permissions
    "read_user",
    "read_account",
    "create_course", "read_course", "update_course",
    "create_blog", "read_blog", "update_blog",
    "read_media", "create_media",
    // Karate instruction permissions
    "create_class", "read_class", "update_class",
    "read_equipment",
    "read_member", "update_member",
    "read_bill",
    "read_payment",
    // New resources
    "read_gallery", "create_gallery",
    "read_event", "create_event", "update_event",
    "read_announcement",
    "read_certificate", "create_certificate",
    // Enrollment permissions for instructors
    "read_enrollment",
    // Schedule permissions for instructors
    "create_schedule", "read_schedule", "update_schedule",
    // Monthly fee view
    "read_monthly_fee",
  ],
  STUDENT: [
    // Basic read permissions
    "read_course",
    "read_blog",
    "read_media",
    // Karate student permissions
    "read_class",
    "read_equipment",
    "read_member", // Can view other members
    "read_bill", // Can view their own bills
    "read_payment", // Can view their own payments
    // Gallery and events access
    "read_gallery",
    "read_event",
    "read_announcement",
    "read_certificate", // Can view their own certificates
    // Enrollment - can view own
    "read_enrollment", "create_enrollment",
    // Monthly fee - can view own
    "read_monthly_fee",
    // Schedule
    "read_schedule",
  ],
  MEMBER: [
    // Similar to STUDENT but with less access
    "read_blog",
    "read_class",
    "read_gallery",
    "read_event",
    "read_announcement",
    // Can create enrollment application
    "create_enrollment",
    "read_enrollment",
    "read_schedule",
  ],
  USER: [
    // Minimal permissions
    "read_blog",
    // Basic karate info access
    "read_class",
    // Public gallery and announcements
    "read_gallery",
    "read_event",
    "read_announcement",
    // Can apply for enrollment
    "create_enrollment",
    "read_enrollment",
    "read_schedule",
  ],
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
    
    const allowedResources = [
      "USER", "ACCOUNT", "SESSION", "PROVIDER", "ROLE", "PERMISSION",
      "COURSE", "BLOG", "MEDIA", "CLASS", "EQUIPMENT", "MEMBER", "BILL", "PAYMENT",
      "GALLERY", "EVENT", "ANNOUNCEMENT", "CERTIFICATE", "REPORT",
      "ENROLLMENT", "MONTHLY_FEE", "SCHEDULE", "PROGRAM", "PROGRAM_REGISTRATION"
    ] as const;

    for (const permData of defaultPermissions) {
      if (!allowedResources.includes(permData.resource as typeof allowedResources[number])) {
        console.warn(`Skipping permission with invalid resource: ${permData.name} (${permData.resource})`);
        continue;
      }
      const existingPermission = await db.select().from(permission).where(eq(permission.name, permData.name)).limit(1);
      
      if (existingPermission.length === 0) {
        const permId = await createPermission(
          permData.name,
          permData.resource as typeof allowedResources[number],
          permData.action,
          permData.description
        );
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
