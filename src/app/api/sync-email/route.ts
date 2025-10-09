import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/connect-db';
import { user } from '@/db/schemas/auth/users';
import { eq } from 'drizzle-orm';

export async function POST() {
  try {
    // Get authenticated user from Supabase
    const supabase = createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update local database with Supabase user's email
    await db
      .update(user)
      .set({ 
        email: authUser.email!,
        emailVerified: authUser.email_confirmed_at ? true : false,
      })
      .where(eq(user.id, authUser.id));

    return NextResponse.json({ 
      success: true,
      email: authUser.email 
    });
  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync email' },
      { status: 500 }
    );
  }
}
