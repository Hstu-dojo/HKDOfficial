import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/connect-db';
import { user } from '@/db/schemas/auth/users';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // Get the old email from request body
    const body = await request.json();
    const oldEmail = body.oldEmail;

    if (!oldEmail) {
      return NextResponse.json(
        { error: 'Old email is required' },
        { status: 400 }
      );
    }

    // Get authenticated user from Supabase
    const supabase = createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update local database using old email to find the record
    // (Local DB uses its own UUID, not Supabase user ID)
    const result = await db
      .update(user)
      .set({ 
        email: authUser.email!,
        emailVerified: authUser.email_confirmed_at ? true : false,
      })
      .where(eq(user.email, oldEmail))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: `User with email ${oldEmail} not found in local database` },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      email: authUser.email,
      oldEmail: oldEmail,
      updated: result[0]
    });
  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
