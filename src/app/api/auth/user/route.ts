import { NextResponse, NextRequest } from "next/server";
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export const GET = async (req: NextRequest) => {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error("Auth error:", error);
      return NextResponse.json({
        message: "Auth error",
        error: error.message,
        data: null,
      }, { status: 401 });
    }
    
    if (session?.user) {
      console.log("Supabase user session:", session.user);
      console.log("User data:", JSON.stringify(session.user, null, 2));
      
      return NextResponse.json({
        message: "Success!",
        data: {
          id: user.id,
          email: user.email,
          name: session.user.user_metadata?.full_name || session.user.user_metadata?.user_name,
          image: session.user.user_metadata?.avatar_url,
          emailVerified: !!user.email_confirmed_at,
        },
      });
    } else {
      console.log("No user session");
      return NextResponse.json({
        message: "Not authenticated",
        data: null,
      }, { status: 401 });
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json({
      message: "Internal server error",
      error: "Something went wrong",
      data: null,
    }, { status: 500 });
  }
};
