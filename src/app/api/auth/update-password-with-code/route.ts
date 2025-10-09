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

    console.log('Updating password with reset code');

    // Use Supabase Admin client to update password without needing the code exchange
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
      
      // Set the session using the token
      // For PKCE tokens, we need to extract them differently
      let accessToken = code;
      
      // If it's a PKCE token from the hash, it's already an access token
      console.log('Attempting to verify token/code:', code.substring(0, 20) + '...');
      
      // Try to get the user using this token as an access token
      const { data: { user }, error } = await tempClient.auth.getUser(accessToken);
      
      if (error || !user) {
        console.error("Failed to get user from token:", error);
        
        // If direct token usage failed, try to use it as a session token
        // by creating a minimal session object
        const tempClientWithAuth = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${accessToken}`
              }
            }
          }
        );
        
        const { data: { user: authUser }, error: authError } = await tempClientWithAuth.auth.getUser();
        
        if (authError || !authUser) {
          console.error("Failed to authenticate with token:", authError);
          return NextResponse.json(
            { error: "Invalid or expired reset code" },
            { status: 400 }
          );
        }
        
        userId = authUser.id;
      } else {
        userId = user.id;
      }
      
      console.log('Successfully identified user:', userId);
    } catch (error) {
      console.error("Exception getting user from token:", error);
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
      console.error("Password update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 400 }
      );
    }

    console.log('Password updated successfully');
    return NextResponse.json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("Update password API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}