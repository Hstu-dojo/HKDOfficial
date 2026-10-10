import { protectApiRoute } from '@/lib/rbac/middleware';
import { NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { userRole, role, user } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const GET = protectApiRoute("ROLE", "READ", async (request, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user's roles with role details
    const userRoles = await db
      .select({
        id: userRole.id,
        roleId: userRole.roleId,
        userId: userRole.userId,
        assignedAt: userRole.assignedAt,
        isActive: userRole.isActive,
        role: {
          id: role.id,
          name: role.name,
          description: role.description,
          isActive: role.isActive
        }
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .where(eq(userRole.userId, userId));

    return NextResponse.json({
      userRoles
    });

  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
