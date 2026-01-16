import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { 
  getAllRoles, 
  createRole,
} from "@/lib/rbac/permissions";

// GET /api/rbac/roles - Get all roles
export const GET = protectApiRoute("ROLE", "READ", async (request, context) => {
  try {
    const roles = await getAllRoles();
    return NextResponse.json({ roles, total: roles.length });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 });
  }
});

// POST /api/rbac/roles - Create a new role
export const POST = protectApiRoute("ROLE", "CREATE", async (request, context) => {
  try {
    const { name, description } = await request.json();
    
    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }
    
    const roleId = await createRole(name, description);
    
    if (!roleId) {
      return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
    }
    
    return NextResponse.json({ roleId, message: "Role created successfully" }, { status: 201 });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "Failed to create role" }, { status: 500 });
  }
});
