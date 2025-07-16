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

// RBAC Types
export type ResourceType = "USER" | "ACCOUNT" | "SESSION" | "VERIFICATION_TOKEN" | "PROVIDER" | "ROLE" | "PERMISSION" | "LEVEL" | "COURSE" | "BLOG" | "MEDIA";
export type ActionType = "CREATE" | "READ" | "UPDATE" | "DELETE" | "MANAGE";

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
