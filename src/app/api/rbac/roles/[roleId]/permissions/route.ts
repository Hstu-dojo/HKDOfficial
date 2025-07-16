import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { 
  assignPermissionToRole,
  removePermissionFromRole
} from "@/lib/rbac/permissions";

// POST /api/rbac/roles/[roleId]/permissions - Assign permission to role
export const POST = protectApiRoute("ROLE", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/')[4]; // Extract roleId from path
    const { permissionId } = await request.json();
    
    if (!roleId || !permissionId) {
      return NextResponse.json({ error: "Role ID and permission ID are required" }, { status: 400 });
    }
    
    const success = await assignPermissionToRole(roleId, permissionId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to assign permission to role" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Permission assigned to role successfully" });
  } catch (error) {
    console.error("Error assigning permission to role:", error);
    return NextResponse.json({ error: "Failed to assign permission to role" }, { status: 500 });
  }
});

// DELETE /api/rbac/roles/[roleId]/permissions - Remove permission from role
export const DELETE = protectApiRoute("ROLE", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/')[4]; // Extract roleId from path
    const { permissionId } = await request.json();
    
    if (!roleId || !permissionId) {
      return NextResponse.json({ error: "Role ID and permission ID are required" }, { status: 400 });
    }
    
    const success = await removePermissionFromRole(roleId, permissionId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to remove permission from role" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Permission removed from role successfully" });
  } catch (error) {
    console.error("Error removing permission from role:", error);
    return NextResponse.json({ error: "Failed to remove permission from role" }, { status: 500 });
  }
});
