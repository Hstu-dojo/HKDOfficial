import { NextResponse, NextRequest } from "next/server";
import { db } from "../../../../lib/connect-db";
import { user } from "../../../../db/schema";
import { eq } from "drizzle-orm";
import { hash } from "../../../../lib/hash";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password, provider } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Verify the user is authenticated via Supabase
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session?.user || session.user.email !== email) {
      return NextResponse.json(
        { error: "Unauthorized or session mismatch" },
        { status: 401 }
      );
    }

    // Hash the password
    const hashedPassword = await hash(password);

    // Update the user's password in the database
    const updatedUser = await db
      .update(user)
      .set({ 
        password: hashedPassword
      })
      .where(eq(user.email, email))
      .returning();

    if (updatedUser.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: "Password set successfully",
      success: true
    });

  } catch (error) {
    console.error("Setup password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}