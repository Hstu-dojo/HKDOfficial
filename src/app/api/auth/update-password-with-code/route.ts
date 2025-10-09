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

    // Try to use the code as an access token to create a temporary session
    let userId: string;
    
    if (code.startsWith('pkce_')) {
      // For PKCE tokens, we need to exchange them for a session first
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error || !data.user) {
          console.error("Failed to exchange PKCE code:", error);
          return NextResponse.json(
            { error: "Invalid or expired reset code" },
            { status: 400 }
          );
        }
        
        userId = data.user.id;
      } catch (error) {
        console.error("Exception exchanging PKCE code:", error);
        return NextResponse.json(
          { error: "Invalid or expired reset code" },
          { status: 400 }
        );
      }
    } else {
      // For regular codes, try to use them as access tokens
      try {
        // Create a temporary client with the access token
        const tempClient = createClient(
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
        
        const { data: { user }, error } = await tempClient.auth.getUser();
        
        if (error || !user) {
          console.error("Failed to get user from token:", error);
          return NextResponse.json(
            { error: "Invalid or expired reset code" },
            { status: 400 }
          );
        }
        
        userId = user.id;
      } catch (error) {
        console.error("Exception getting user from token:", error);
        return NextResponse.json(
          { error: "Invalid or expired reset code" },
          { status: 400 }
        );
      }
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