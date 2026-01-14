import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { db } from "@/lib/connect-db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/auth/get-local-user-id - Get local DB user ID from Supabase user ID
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const supabaseId = searchParams.get('supabaseId');

    if (!supabaseId) {
      return NextResponse.json(
        { error: 'Supabase user ID is required' },
        { status: 400 }
      );
    }

    // Verify the requesting user is asking for their own ID or has admin rights
    if (session.user.id !== supabaseId) {
      // TODO: Add admin permission check here
      return NextResponse.json(
        { error: 'Forbidden: Can only get your own user ID' },
        { status: 403 }
      );
    }

    // Get local DB user ID from Supabase user ID
    const result = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.supabaseUserId, supabaseId))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'User not found in local database' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      localUserId: result[0].id,
      supabaseUserId: supabaseId
    });
  } catch (error) {
    console.error('Error getting local user ID:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
