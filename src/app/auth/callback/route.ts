import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/connect-db'
import { user } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/en'
  const type = requestUrl.searchParams.get('type') // Check if this is a password reset

  console.log('Auth callback - URL:', requestUrl.toString())
  console.log('Auth callback - code:', code)
  console.log('Auth callback - next:', next)
  console.log('Auth callback - type:', type)

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error && data.user) {
        const supabaseUser = data.user
        
        // Check if user exists in local database
        try {
          const existingUser = await db
            .select()
            .from(user)
            .where(eq(user.email, supabaseUser.email!))
            .limit(1)

          if (existingUser.length === 0) {
            // Create new user in local database for OAuth users
            // Use a temporary password - user will be prompted to set a real one
            const tempPassword = `temp_${supabaseUser.id}_${Date.now()}`;
            
            await db.insert(user).values({
              email: supabaseUser.email!,
              emailVerified: true,
              password: tempPassword, // Temporary - user will set their own
              userName: supabaseUser.user_metadata?.full_name || 
                        supabaseUser.user_metadata?.user_name || 
                        supabaseUser.email!.split('@')[0],
              userAvatar: supabaseUser.user_metadata?.avatar_url || "/image/avatar/Milo.svg",
              defaultRole: "MEMBER", // Default role for OAuth users
            })

            // Redirect new OAuth users to password setup page
            const setupUrl = new URL('/en/auth/setup-password', requestUrl.origin);
            setupUrl.searchParams.set('email', supabaseUser.email!);
            setupUrl.searchParams.set('provider', supabaseUser.app_metadata?.provider || 'OAuth');
            setupUrl.searchParams.set('callbackUrl', next);
            return NextResponse.redirect(setupUrl);
          } else {
            // User already exists - this is a login, not registration
            // Update verification status and sync profile data from OAuth provider
            await db
              .update(user)
              .set({ 
                emailVerified: true,
                // Update avatar if OAuth provides one, otherwise keep existing
                userAvatar: supabaseUser.user_metadata?.avatar_url || existingUser[0].userAvatar,
                // Update username if OAuth provides a better one, otherwise keep existing
                userName: supabaseUser.user_metadata?.full_name || 
                          supabaseUser.user_metadata?.user_name || 
                          existingUser[0].userName
              })
              .where(eq(user.email, supabaseUser.email!))
          }
        } catch (dbError) {
          console.error('Database sync error:', dbError)
          // Continue with the flow even if database sync fails
        }

        // Check if this is a password reset flow by examining the next parameter
        if (next === '/en/reset-password') {
          console.log('Password recovery detected, redirecting to reset password page')
          return NextResponse.redirect(new URL('/en/reset-password', requestUrl.origin))
        }

        // Redirect to success page - whether it's a new user or existing user login
        return NextResponse.redirect(new URL(`${next}?verified=true`, requestUrl.origin))
      }
    } catch (exchangeError) {
      console.error('Code exchange error:', exchangeError)
    }
  }

  // Redirect to error page with language prefix
  return NextResponse.redirect(new URL('/en/auth/auth-code-error', requestUrl.origin))
}