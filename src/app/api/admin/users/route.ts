import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { db } from "@/lib/connect-db";
import { user, userRole, role } from "@/db/schema";
import { eq, like, or, desc } from "drizzle-orm";

// GET /api/admin/users - Get all users with their roles
export const GET = protectApiRoute("USER", "READ", async (request, context) => {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    const roleFilter = url.searchParams.get('role') || '';
    const statusFilter = url.searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build the query
    let whereConditions: any[] = [];

    if (search) {
      whereConditions.push(
        or(
          like(user.userName, `%${search}%`),
          like(user.email, `%${search}%`)
        )
      );
    }

    if (statusFilter === 'verified') {
      whereConditions.push(eq(user.emailVerified, true));
    } else if (statusFilter === 'unverified') {
      whereConditions.push(eq(user.emailVerified, false));
    }

    // Get users with their roles
    const users = await db
      .select({
        id: user.id,
        userName: user.userName,
        email: user.email,
        userAvatar: user.userAvatar,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        defaultRole: user.defaultRole,
      })
      .from(user)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    // Get roles for each user
    const usersWithRoles = await Promise.all(
      users.map(async (userData) => {
        const userRoles = await db
          .select({
            id: role.id,
            name: role.name,
            description: role.description,
          })
          .from(userRole)
          .innerJoin(role, eq(userRole.roleId, role.id))
          .where(eq(userRole.userId, userData.id));

        return {
          ...userData,
          roles: userRoles,
        };
      })
    );

    // Filter by role if specified
    const filteredUsers = roleFilter 
      ? usersWithRoles.filter(u => 
          u.defaultRole === roleFilter || 
          u.roles.some(r => r.name === roleFilter)
        )
      : usersWithRoles;

    // Get total count for pagination
    const totalUsers = await db
      .select({ count: user.id })
      .from(user)
      .where(whereConditions.length > 0 ? whereConditions[0] : undefined);

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: totalUsers.length,
        totalPages: Math.ceil(totalUsers.length / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
});

// POST /api/admin/users - Create a new user
export const POST = protectApiRoute("USER", "CREATE", async (request, context) => {
  try {
    const { userName, email, password, defaultRole, emailVerified } = await request.json();

    if (!userName || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash password (you'll need to implement this)
    // const hashedPassword = await hash(password);

    // Create user
    const newUser = await db
      .insert(user)
      .values({
        userName,
        email,
        password, // Use hashedPassword in production
        defaultRole: defaultRole || 'GUEST',
        emailVerified: emailVerified || false,
        userAvatar: `/image/avatar/default.svg`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      { message: "User created successfully", user: newUser[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
});
