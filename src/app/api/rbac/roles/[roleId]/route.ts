import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { 
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions
} from "@/lib/rbac/permissions";

// GET /api/rbac/roles/[roleId] - Get a specific role with its permissions
export const GET = protectApiRoute("ROLE", "READ", async (request, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/')[4]; // Extract roleId from path
    
    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }
    
    const role = await getRoleById(roleId);
    
    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }
    
    const permissions = await getRolePermissions(roleId);
    
    return NextResponse.json({ 
      role: {
        ...role,
        permissions
      }
    });
  } catch (error) {
    console.error("Error fetching role:", error);
    return NextResponse.json({ error: "Failed to fetch role" }, { status: 500 });
  }
});

// PUT /api/rbac/roles/[roleId] - Update a role
export const PUT = protectApiRoute("ROLE", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/')[4]; // Extract roleId from path
    const body = await request.json();
    
    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }
    
    const { name, description, isActive } = body;
    
    const success = await updateRole(roleId, { name, description, isActive });
    
    if (!success) {
      return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Role updated successfully" });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "Failed to update role" }, { status: 500 });
  }
});

// DELETE /api/rbac/roles/[roleId] - Delete a role
export const DELETE = protectApiRoute("ROLE", "DELETE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/')[4]; // Extract roleId from path
    
    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }
    
    // Prevent deletion of core roles
    const role = await getRoleById(roleId);
    if (role && ["SUPER_ADMIN", "ADMIN", "GUEST"].includes(role.name)) {
      return NextResponse.json({ 
        error: "Cannot delete core system roles" 
      }, { status: 403 });
    }
    
    const success = await deleteRole(roleId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Role deleted successfully" });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ error: "Failed to delete role" }, { status: 500 });
  }
});
