import { NextRequest, NextResponse } from "next/server";
import { handleCors, handleOptions } from "@/lib/cors";

export async function GET() {
  const response = NextResponse.json({
    message: "Karate Dojo API is running",
    version: "1.0.0",
    endpoints: {
      documentation: "/api",
      swagger: "/api/swagger",
      info: "/api/info",
      authentication: {
        signup: "/api/auth/signup",
        signin: "/api/auth/signin"
      },
      rbac: {
        roles: "/api/rbac/roles",
        permissions: "/api/rbac/permissions",
        userRoles: "/api/rbac/users/{userId}/roles",
        rolePermissions: "/api/rbac/roles/{roleId}/permissions",
        seed: "/api/rbac/seed"
      }
    },
    timestamp: new Date().toISOString()
  });
  
  return handleCors(response);
}

export async function OPTIONS() {
  return handleOptions();
}
