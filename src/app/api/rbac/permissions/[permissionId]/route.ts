import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { 
  getPermissionById,
  updatePermission,
  deletePermission
} from "@/lib/rbac/permissions";
import type { ResourceType, ActionType } from "@/lib/rbac/types";

// GET /api/rbac/permissions/[permissionId] - Get a specific permission
export const GET = protectApiRoute("PERMISSION", "READ", async (request, context) => {
  try {
    const url = new URL(request.url);
    const permissionId = url.pathname.split('/')[4]; // Extract permissionId from path
    
    if (!permissionId) {
      return NextResponse.json({ error: "Permission ID is required" }, { status: 400 });
    }
    
    const permission = await getPermissionById(permissionId);
    
    if (!permission) {
      return NextResponse.json({ error: "Permission not found" }, { status: 404 });
    }
    
    return NextResponse.json({ permission });
  } catch (error) {
    console.error("Error fetching permission:", error);
    return NextResponse.json({ error: "Failed to fetch permission" }, { status: 500 });
  }
});

// PUT /api/rbac/permissions/[permissionId] - Update a permission
export const PUT = protectApiRoute("PERMISSION", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const permissionId = url.pathname.split('/')[4]; // Extract permissionId from path
    const body = await request.json();
    
    if (!permissionId) {
      return NextResponse.json({ error: "Permission ID is required" }, { status: 400 });
    }
    
    const { name, description, resource, action } = body;
    
    const updateData: { 
      name?: string; 
      description?: string; 
      resource?: ResourceType; 
      action?: ActionType 
    } = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (resource !== undefined) updateData.resource = resource;
    if (action !== undefined) updateData.action = action;
    
    const success = await updatePermission(permissionId, updateData);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to update permission" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Permission updated successfully" });
  } catch (error) {
    console.error("Error updating permission:", error);
    return NextResponse.json({ error: "Failed to update permission" }, { status: 500 });
  }
});

// DELETE /api/rbac/permissions/[permissionId] - Delete a permission
export const DELETE = protectApiRoute("PERMISSION", "DELETE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const permissionId = url.pathname.split('/')[4]; // Extract permissionId from path
    
    if (!permissionId) {
      return NextResponse.json({ error: "Permission ID is required" }, { status: 400 });
    }
    
    const success = await deletePermission(permissionId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to delete permission" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Permission deleted successfully" });
  } catch (error) {
    console.error("Error deleting permission:", error);
    return NextResponse.json({ error: "Failed to delete permission" }, { status: 500 });
  }
});
