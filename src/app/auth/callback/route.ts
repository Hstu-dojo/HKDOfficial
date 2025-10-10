import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') ?? '/en'

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Handle password recovery with token_hash (PKCE flow for password reset)
  if (token_hash && type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    })

    if (error) {
      return NextResponse.redirect(new URL('/en/auth/auth-code-error', requestUrl.origin))
    }

    return NextResponse.redirect(new URL('/en/reset-password', requestUrl.origin))
  }

  // Handle email change confirmation
  if (token_hash && type === 'email_change') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email_change',
    })

    if (error) {
      const errorUrl = new URL('/en/profile', requestUrl.origin)
      errorUrl.searchParams.set('error', 'Email change verification failed: ' + error.message)
      return NextResponse.redirect(errorUrl)
    }

    // Email change successful - redirect to profile with success message
    const successUrl = new URL('/en/profile', requestUrl.origin)
    successUrl.searchParams.set('message', 'Email updated successfully!')
    successUrl.searchParams.set('sync_email', 'true') // Flag to trigger client-side sync
    return NextResponse.redirect(successUrl)
  }

  // Handle regular OAuth or signup confirmation with code
  if (code) {
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.user) {
        const supabaseUser = data.user
        
        // Check if user exists in local database by Supabase ID
        try {
          const existingUser = await db
            .select()
            .from(user)
            .where(eq(user.supabaseUserId, supabaseUser.id))
            .limit(1)

          if (existingUser.length === 0) {
            // Create new user in local database
            console.log('Creating new user in local DB for Supabase user:', supabaseUser.id);
            
            // Get username and avatar from metadata (set during signup)
            const userName = supabaseUser.user_metadata?.username || 
                           supabaseUser.user_metadata?.user_name ||
                           supabaseUser.user_metadata?.full_name || 
                           supabaseUser.email!.split('@')[0];
            
            const userAvatar = supabaseUser.user_metadata?.avatar_url || "/image/avatar/Milo.svg";
            
            await db.insert(user).values({
              supabaseUserId: supabaseUser.id, // Link to Supabase!
              email: supabaseUser.email, // Optional - for display only
              emailVerified: supabaseUser.email_confirmed_at ? true : false,
              password: `supabase_${supabaseUser.id}`, // Placeholder - not used for Supabase auth
              userName: userName,
              userAvatar: userAvatar,
              defaultRole: "GUEST", // Default role - will be upgraded after admin approval
            })

            console.log('✅ User created in local DB');
          } else {
            // User already exists - update their info
            console.log('Updating existing user in local DB');
            await db
              .update(user)
              .set({ 
                email: supabaseUser.email, // Update email (optional field)
                emailVerified: supabaseUser.email_confirmed_at ? true : false,
                // Update avatar if provided
                userAvatar: supabaseUser.user_metadata?.avatar_url || existingUser[0].userAvatar,
              })
              .where(eq(user.supabaseUserId, supabaseUser.id))
          }
        } catch (dbError) {
          console.error('Database error during user creation/update:', dbError);
          // Continue with the flow even if database sync fails
        }

        // Redirect to success page - whether it's a new user or existing user login
        return NextResponse.redirect(new URL(`${next}?verified=true`, requestUrl.origin))
      }
    } catch (exchangeError) {
      console.error('Exchange code error:', exchangeError);
      // Handle exchange errors silently
    }
  }

  // Redirect to error page with language prefix
  return NextResponse.redirect(new URL('/en/auth/auth-code-error', requestUrl.origin))
}