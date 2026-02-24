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

    const { userId, roleId, isSupabaseId } = await request.json();

    if (!userId || !roleId) {
      return NextResponse.json(
        { error: 'User ID and Role ID are required' },
        { status: 400 }
      );
    }

    // If userId is a Supabase ID, convert it to local DB ID
    let localUserId = userId;
    if (isSupabaseId) {
      const result = await db.select({ id: user.id }).from(user).where(eq(user.supabaseUserId, userId));
      if (result.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      localUserId = result[0].id;
    }

    // Verify user exists
    const userExists = await db.select().from(user).where(eq(user.id, localUserId));
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

    // Check if user already has this role (active or inactive)
    const existingAssignment = await db
      .select()
      .from(userRole)
      .where(and(eq(userRole.userId, localUserId), eq(userRole.roleId, roleId)));

    let assignment;
    
    if (existingAssignment.length > 0) {
      // If assignment exists but is inactive, reactivate it
      if (!existingAssignment[0].isActive) {
        const updated = await db
          .update(userRole)
          .set({ 
            isActive: true, 
            assignedBy: currentUser[0].id,
            assignedAt: new Date()
          })
          .where(eq(userRole.id, existingAssignment[0].id))
          .returning();
        assignment = updated;
      } else {
        // Already has active role
        return NextResponse.json(
          { error: 'User already has this role' },
          { status: 400 }
        );
      }
    } else {
      // Create new assignment
      assignment = await db.insert(userRole).values({
        userId: localUserId,
        roleId,
        assignedBy: currentUser[0].id,
        isActive: true,
      }).returning();
    }

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