import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { 
  getAllPermissions, 
  createPermission
} from "@/lib/rbac/permissions";
import type { ResourceType, ActionType } from "@/lib/rbac/types";

// GET /api/rbac/permissions - Get all permissions
export const GET = protectApiRoute("PERMISSION", "READ", async (request, context) => {
  try {
    const permissions = await getAllPermissions();
    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("Error fetching permissions:", error);
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 });
  }
});

// POST /api/rbac/permissions - Create a new permission
export const POST = protectApiRoute("PERMISSION", "CREATE", async (request, context) => {
  try {
    const { name, resource, action, description } = await request.json();
    
    if (!name || !resource || !action) {
      return NextResponse.json({ 
        error: "Permission name, resource, and action are required" 
      }, { status: 400 });
    }
    
    const permissionId = await createPermission(
      name, 
      resource as ResourceType, 
      action as ActionType, 
      description
    );
    
    if (!permissionId) {
      return NextResponse.json({ error: "Failed to create permission" }, { status: 500 });
    }
    
    return NextResponse.json({ permissionId, message: "Permission created successfully" });
  } catch (error) {
    console.error("Error creating permission:", error);
    return NextResponse.json({ error: "Failed to create permission" }, { status: 500 });
  }
});
