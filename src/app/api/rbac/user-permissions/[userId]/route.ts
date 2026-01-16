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
    console.log("[user-permissions API] Starting GET request");
    
    const context = await getRBACContext();
    console.log("[user-permissions API] RBAC Context:", context ? { userId: context.userId, email: context.email } : null);
    
    if (!context) {
      console.log("[user-permissions API] No context - returning 401");
      return NextResponse.json({ error: "Unauthorized - No RBAC context" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    console.log("[user-permissions API] Requested userId:", userId);
    console.log("[user-permissions API] Context userId:", context.userId);
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    // Users can always fetch their own permissions
    // For other users, require USER:READ permission
    if (userId !== context.userId) {
      console.log("[user-permissions API] Checking permission to read other user");
      const canReadOthers = await hasPermission(context.userId, "USER", "READ");
      if (!canReadOthers) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    // Use the fallback function that considers both userRole table AND defaultRole
    console.log("[user-permissions API] Fetching permissions for userId:", userId);
    const userPermissions = await getUserPermissionsWithFallback(userId);
    console.log("[user-permissions API] Got permissions:", { 
      roles: userPermissions.roles.map(r => r.name), 
      permissionCount: userPermissions.permissions.length 
    });
    
    return NextResponse.json({ userPermissions });
  } catch (error) {
    console.error("[user-permissions API] Error:", error);
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
