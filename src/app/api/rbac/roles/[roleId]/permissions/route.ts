import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { 
  assignPermissionToRole,
  removePermissionFromRole,
  getRolePermissions,
  bulkAssignPermissionsToRole,
  bulkRemovePermissionsFromRole
} from "@/lib/rbac/permissions";

// GET /api/rbac/roles/[roleId]/permissions - Get all permissions for a role
export const GET = protectApiRoute("ROLE", "READ", async (request, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/')[4]; // Extract roleId from path
    
    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }
    
    const permissions = await getRolePermissions(roleId);
    return NextResponse.json({ permissions, total: permissions.length });
  } catch (error) {
    console.error("Error fetching role permissions:", error);
    return NextResponse.json({ error: "Failed to fetch role permissions" }, { status: 500 });
  }
});

// POST /api/rbac/roles/[roleId]/permissions - Assign permission(s) to role
export const POST = protectApiRoute("ROLE", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/')[4]; // Extract roleId from path
    const { permissionId, permissionIds } = await request.json();
    
    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }
    
    // Support bulk assignment
    if (permissionIds && Array.isArray(permissionIds)) {
      const success = await bulkAssignPermissionsToRole(roleId, permissionIds);
      if (!success) {
        return NextResponse.json({ error: "Failed to assign permissions to role" }, { status: 500 });
      }
      return NextResponse.json({ message: `${permissionIds.length} permission(s) assigned to role successfully` });
    }
    
    // Single permission assignment
    if (!permissionId) {
      return NextResponse.json({ error: "Permission ID is required" }, { status: 400 });
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

// DELETE /api/rbac/roles/[roleId]/permissions - Remove permission(s) from role
export const DELETE = protectApiRoute("ROLE", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const roleId = url.pathname.split('/')[4]; // Extract roleId from path
    const { permissionId, permissionIds } = await request.json();
    
    if (!roleId) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 });
    }
    
    // Support bulk removal
    if (permissionIds && Array.isArray(permissionIds)) {
      const success = await bulkRemovePermissionsFromRole(roleId, permissionIds);
      if (!success) {
        return NextResponse.json({ error: "Failed to remove permissions from role" }, { status: 500 });
      }
      return NextResponse.json({ message: `${permissionIds.length} permission(s) removed from role successfully` });
    }
    
    // Single permission removal
    if (!permissionId) {
      return NextResponse.json({ error: "Permission ID is required" }, { status: 400 });
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
