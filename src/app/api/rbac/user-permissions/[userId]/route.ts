import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute, getRBACContext } from "@/lib/rbac/middleware";
import { 
  getUserPermissions,
  getUserPermissionsWithFallback,
  assignRole,
  removeRole,
  hasPermission
} from "@/lib/rbac/permissions";

// GET /api/rbac/user-permissions/[userId] - Get user permissions
// Users can always fetch their OWN permissions, but need USER:READ for others
export async function GET(request: NextRequest) {
  try {
    const context = await getRBACContext();
    
    if (!context) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    // Users can always fetch their own permissions
    // For other users, require USER:READ permission
    if (userId !== context.userId) {
      const canReadOthers = await hasPermission(context.userId, "USER", "READ");
      if (!canReadOthers) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    // Use the fallback function that considers both userRole table AND defaultRole
    const userPermissions = await getUserPermissionsWithFallback(userId);
    return NextResponse.json({ userPermissions });
  } catch (error) {
    console.error("Error fetching user permissions:", error);
    return NextResponse.json({ error: "Failed to fetch user permissions" }, { status: 500 });
  }
}

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
