import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/connect-db";
import { user as userTable } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hash } from "@/lib/hash";
import { createClient } from "@/lib/supabase/server";
import { ensureUserExists } from "@/lib/auth/user-sync";

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
    const supabase = await createClient();
    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !supabaseUser || (supabaseUser.email && supabaseUser.email.toLowerCase() !== email.toLowerCase())) {
      return NextResponse.json(
        { error: "Unauthorized or session mismatch" },
        { status: 401 }
      );
    }

    // Ensure local user record exists
    const localUser = await ensureUserExists(supabaseUser);

    // Hash the password
    const hashedPassword = await hash(password);

    // Update the user's password in the database
    await db
      .update(userTable)
      .set({ 
        password: hashedPassword,
        hasPassword: true,
        updatedAt: new Date(),
      })
      .where(eq(userTable.id, localUser.id));

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