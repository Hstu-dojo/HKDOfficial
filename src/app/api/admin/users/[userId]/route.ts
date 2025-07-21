import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { db } from "@/lib/connect-db";
import { user, userRole, role } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/admin/users/[userId] - Get specific user
export const GET = protectApiRoute("USER", "READ", async (request, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user data
    const userData = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (userData.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get user roles
    const userRoles = await db
      .select({
        id: role.id,
        name: role.name,
        description: role.description,
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .where(eq(userRole.userId, userId));

    const userWithRoles = {
      ...userData[0],
      roles: userRoles,
    };

    return NextResponse.json({ user: userWithRoles });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
});

// PUT /api/admin/users/[userId] - Update user
export const PUT = protectApiRoute("USER", "UPDATE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    const updateData = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Remove password from update if empty
    if (updateData.password === '') {
      delete updateData.password;
    }

    // Update user
    const updatedUser = await db
      .update(user)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User updated successfully",
      user: updatedUser[0],
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
});

// DELETE /api/admin/users/[userId] - Delete user
export const DELETE = protectApiRoute("USER", "DELETE", async (request, context) => {
  try {
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Don't allow deleting yourself
    if (userId === context.userId) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 }
      );
    }

    // Delete user roles first (foreign key constraint)
    await db.delete(userRole).where(eq(userRole.userId, userId));

    // Delete user
    const deletedUser = await db
      .delete(user)
      .where(eq(user.id, userId))
      .returning();

    if (deletedUser.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
});
