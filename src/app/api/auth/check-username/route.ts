import { NextResponse } from 'next/server';
import { db } from '@/lib/connect-db';
import { user } from '@/db/schemas/auth/users';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userName } = body;

    if (!userName) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if username exists in local database
    const existingUsers = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.userName, userName))
      .limit(1);

    return NextResponse.json({ 
      exists: existingUsers.length > 0 
    });
  } catch (error) {
    console.error('Username check error:', error);
    // Return false on error to allow registration attempt
    return NextResponse.json({ exists: false });
  }
}
