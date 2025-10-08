import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { db } from '@/lib/connect-db';
import { userRole, user, role } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, roleId } = await request.json();

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'User ID and Role ID are required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const userExists = await db.select().from(user).where(eq(user.id, userId));
    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify role exists
    const roleExists = await db.select().from(role).where(eq(role.id, roleId));
    if (roleExists.length === 0) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if user already has this role
    const existingAssignment = await db
      .select()
      .from(userRole)
      .where(and(eq(userRole.userId, userId), eq(userRole.roleId, roleId)));

    if (existingAssignment.length > 0) {
      return NextResponse.json(
        { error: 'User already has this role' },
        { status: 400 }
      );
    }

    // Get current user's ID for assignedBy field using email
    const currentUser = await db
      .select()
      .from(user)
      .where(eq(user.email, session.user.email!));

    if (currentUser.length === 0) {
      return NextResponse.json(
        { error: 'Current user not found in database' },
        { status: 404 }
      );
    }

    // Assign role to user
    const assignment = await db.insert(userRole).values({
      userId,
      roleId,
      assignedBy: currentUser[0].id,
      isActive: true,
    }).returning();

    return NextResponse.json({
      message: 'Role assigned successfully',
      assignment: assignment[0]
    });

  } catch (error) {
    console.error('Error assigning role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}