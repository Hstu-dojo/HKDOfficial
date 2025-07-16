import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { 
  getUserPermissions,
  assignRole,
  removeRole
} from "@/lib/rbac/permissions";

// GET /api/rbac/user-permissions/[userId] - Get user permissions
export const GET = protectApiRoute("USER", "READ", async (request, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    const userPermissions = await getUserPermissions(userId);
    return NextResponse.json({ userPermissions });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json({ error: "Failed to fetch user permissions" }, { status: 500 });
  }
});

// POST /api/rbac/user-permissions/[userId] - Assign role to user
export const POST = protectApiRoute("USER", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    const { roleId } = await request.json();
    
    if (!userId || !roleId) {
      return NextResponse.json({ error: "User ID and role ID are required" }, { status: 400 });
    }
    
    const success = await assignRole(userId, roleId, context.userId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Role assigned successfully" });
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json({ error: "Failed to assign role" }, { status: 500 });
  }
});

// DELETE /api/rbac/user-permissions/[userId] - Remove role from user
export const DELETE = protectApiRoute("USER", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    const { roleId } = await request.json();
    
    if (!userId || !roleId) {
      return NextResponse.json({ error: "User ID and role ID are required" }, { status: 400 });
    }
    
    const success = await removeRole(userId, roleId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to remove role" }, { status: 500 });
    }
    
    return NextResponse.json({ message: "Role removed successfully" });
  } catch (error) {
    console.error("Error removing role:", error);
    return NextResponse.json({ error: "Failed to remove role" }, { status: 500 });
  }
});
