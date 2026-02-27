import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}

// RBAC Types - Keep in sync with src/db/schemas/enums.ts resourceTypeEnum
export type ResourceType = "USER" | "ACCOUNT" | "SESSION" | "PROVIDER" | "ROLE" | "PERMISSION" | "COURSE" | "BLOG" | "MEDIA" | "CLASS" | "EQUIPMENT" | "MEMBER" | "BILL" | "PAYMENT" | "GALLERY" | "EVENT" | "ANNOUNCEMENT" | "CERTIFICATE" | "REPORT" | "ENROLLMENT" | "MONTHLY_FEE" | "SCHEDULE" | "PROGRAM" | "PROGRAM_REGISTRATION" | "PARTNER" | "PARTNER_BILL" | "ADMIN_PANEL";
export type ActionType = "CREATE" | "READ" | "UPDATE" | "DELETE" | "MANAGE" | "APPROVE" | "VERIFY" | "ACCESS";

export interface Permission {
  id: string;
  name: string;
  description?: string | null;
  resource: ResourceType;
  action: ActionType;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  permissions?: Permission[];
}

export interface UserPermissions {
  userId: string;
  roles: Role[];
  permissions: Permission[];
}

export interface RBACContext {
  userId: string;
  email: string;
  roles: string[];
}
  // Admin Panel access
    "access_admin_panel",
    // Admin Panel access
    "access_admin_panel",
    // Admin Panel access
    "access_admin_panel",
  
  // Admin Panel access permission
  { name: "access_admin_panel", resource: "ADMIN_PANEL", action: "ACCESS", description: "Access the admin dashboard" },
