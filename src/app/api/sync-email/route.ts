import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/connect-db';
import { user, provider } from '@/db/schemas/auth/users';
import { eq, or, sql } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // Get the old email from request body (optional - works if provided)
    const body = await request.json().catch(() => ({}));
    const oldEmail = body.oldEmail;

    // Get authenticated user from Supabase
    const supabase = createServerClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Syncing email for Supabase user:', authUser.id, 'New email:', authUser.email);

    let result;
    let strategy = '';

    // Strategy 1: Try using old email if provided (works when localStorage has it)
    if (oldEmail) {
      console.log('Strategy 1: Trying to find user by old email:', oldEmail);
      result = await db
        .update(user)
        .set({ 
          email: authUser.email!,
          emailVerified: authUser.email_confirmed_at ? true : false,
        })
        .where(eq(user.email, oldEmail))
        .returning();
      
      if (result.length > 0) {
        strategy = 'old_email';
      }
    }

    // Strategy 2: Find user by checking provider table for Supabase auth ID
    if (!result || result.length === 0) {
      console.log('Strategy 2: Finding user via provider table with Supabase ID:', authUser.id);
      
      // Find user through provider table (links local user to Supabase user)
      const userViaProvider = await db
        .select({ userId: provider.userId })
        .from(provider)
        .where(eq(provider.providerAccountId, authUser.id))
        .limit(1);

      if (userViaProvider.length > 0) {
        result = await db
          .update(user)
          .set({ 
            email: authUser.email!,
            emailVerified: authUser.email_confirmed_at ? true : false,
          })
          .where(eq(user.id, userViaProvider[0].userId))
          .returning();
        
        if (result.length > 0) {
          strategy = 'provider_table';
        }
      }
    }

    // Strategy 3: Try current email (maybe it's already updated in local DB)
    if (!result || result.length === 0) {
      console.log('Strategy 3: Checking if email already updated to:', authUser.email);
      result = await db
        .select()
        .from(user)
        .where(eq(user.email, authUser.email!))
        .limit(1);
      
      if (result.length > 0) {
        // Just update verification status
        result = await db
          .update(user)
          .set({ emailVerified: authUser.email_confirmed_at ? true : false })
          .where(eq(user.email, authUser.email!))
          .returning();
        strategy = 'already_updated';
      }
    }

    if (!result || result.length === 0) {
      return NextResponse.json(
        { 
          error: 'Cannot find user in local database',
          debug: {
            oldEmail: oldEmail || 'not provided',
            supabaseEmail: authUser.email,
            supabaseId: authUser.id,
            hint: 'Make sure user exists in local database and has a provider record'
          }
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      email: authUser.email,
      oldEmail: oldEmail || 'not provided',
      updated: result[0],
      strategy: strategy
    });
  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
