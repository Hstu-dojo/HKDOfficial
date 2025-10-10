import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/connect-db';
import { user } from '@/db/schemas/auth/users';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { supabaseUserId, hasPassword } = body;

    console.log('🔐 Updating password status for user:', supabaseUserId);

    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is updating their own record
    if (authUser.id !== supabaseUserId) {
      return NextResponse.json(
        { error: 'Forbidden - can only update your own password status' },
        { status: 403 }
      );
    }

    // Update hasPassword in local database
    const updateResult = await db
      .update(user)
      .set({ 
        hasPassword,
        updatedAt: new Date()
      })
      .where(eq(user.supabaseUserId, supabaseUserId))
      .returning();

    if (updateResult.length === 0) {
      return NextResponse.json(
        { error: 'User not found in database' },
        { status: 404 }
      );
    }

    console.log('✅ Password status updated successfully');

    return NextResponse.json({
      success: true,
      user: updateResult[0]
    });

  } catch (error: any) {
    console.error('❌ Error updating password status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update password status' },
      { status: 500 }
    );
  }
}
