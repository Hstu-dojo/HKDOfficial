import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { assignRole, removeRole } from "@/lib/rbac/permissions";
import { db } from "@/lib/connect-db";
import { userRole, role } from "@/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/users/[userId]/roles - Get user roles
export const GET = protectApiRoute("ROLE", "READ", async (request, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/')[4]; // /api/admin/users/[userId]/roles

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    const userRoles = await db
      .select({
        id: role.id,
        name: role.name,
        description: role.description,
        isActive: role.isActive,
        userRoleId: userRole.id,
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .where(eq(userRole.userId, userId));

    return NextResponse.json({ roles: userRoles });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles" },
      { status: 500 }
    );
  }
});

// POST /api/admin/users/[userId]/roles - Assign role to user
export const POST = protectApiRoute("ROLE", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/')[4]; // /api/admin/users/[userId]/roles
    const { roleId } = await request.json();

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: "User ID and Role ID are required" },
        { status: 400 }
      );
    }

    const success = await assignRole(userId, roleId, context.userId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to assign role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Role assigned successfully",
    });
  } catch (error) {
    console.error("Error assigning role:", error);
    return NextResponse.json(
      { error: "Failed to assign role" },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/users/[userId]/roles - Remove role from user
export const DELETE = protectApiRoute("ROLE", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/')[4]; // /api/admin/users/[userId]/roles
    const { roleId } = await request.json();

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: "User ID and Role ID are required" },
        { status: 400 }
      );
    }

    const success = await removeRole(userId, roleId);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to remove role" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Role removed successfully",
    });
  } catch (error) {
    console.error("Error removing role:", error);
    return NextResponse.json(
      { error: "Failed to remove role" },
      { status: 500 }
    );
  }
});
