import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { code, password } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Reset code is required" },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Use Supabase Admin client to update password
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // The code is the user's temporary access token
    // We need to verify it and get the user ID
    // For now, let's try a different approach using the regular client
    const { createServerClient } = await import("@/lib/supabase/server");
    const supabase = createServerClient();

    // Try to use the code/token to get the user
    let userId: string;
    
    try {
      // Create a temporary client with the access token
      // Even PKCE tokens can be used as Bearer tokens for authentication
      const tempClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { user }, error } = await tempClient.auth.getUser(code);
      
      if (error || !user) {
        const tempClientWithAuth = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${code}`
              }
            }
          }
        );
        
        const { data: { user: authUser }, error: authError } = await tempClientWithAuth.auth.getUser();
        
        if (authError || !authUser) {
          return NextResponse.json(
            { error: "Invalid or expired reset code" },
            { status: 400 }
          );
        }
        
        userId = authUser.id;
      } else {
        userId = user.id;
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid or expired reset code" },
        { status: 400 }
      );
    }

    // Update the user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password }
    );

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}