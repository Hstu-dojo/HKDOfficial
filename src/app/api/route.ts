import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Karate Dojo API is running",
    version: "1.0.0",
    endpoints: {
      documentation: "/api",
      swagger: "/api/swagger",
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
}
