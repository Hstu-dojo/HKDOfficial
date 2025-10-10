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

  console.log('🔍 Callback received:', { code: !!code, token_hash: !!token_hash, type, next })

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

  // Handle signup confirmation with token_hash (PKCE flow)
  if (token_hash && type === 'signup') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    })

    if (error) {
      console.error('Signup verification error:', error)
      return NextResponse.redirect(new URL('/en/auth/auth-code-error', requestUrl.origin))
    }

    // Verification successful - create user in local database
    if (data.user) {
      const supabaseUser = data.user
      
      try {
        // Check if user exists in local database
        const existingUser = await db
          .select()
          .from(user)
          .where(eq(user.supabaseUserId, supabaseUser.id))
          .limit(1)

        if (existingUser.length === 0) {
          // Create new user in local database
          console.log('Creating new user after email confirmation:', supabaseUser.id);
          
          const userName = supabaseUser.user_metadata?.username || 
                         supabaseUser.user_metadata?.user_name ||
                         supabaseUser.user_metadata?.full_name || 
                         supabaseUser.email!.split('@')[0];
          
          const userAvatar = supabaseUser.user_metadata?.avatar_url || "/image/avatar/Milo.svg";
          
          await db.insert(user).values({
            supabaseUserId: supabaseUser.id,
            email: supabaseUser.email,
            emailVerified: true, // Just confirmed!
            password: `supabase_${supabaseUser.id}`,
            userName: userName,
            userAvatar: userAvatar,
            defaultRole: "GUEST",
          })

          console.log('✅ User created in local DB after signup confirmation');
        }
      } catch (dbError) {
        console.error('Database error during signup confirmation:', dbError);
      }
    }

    // Redirect to login page with success message
    const successUrl = new URL('/en/login', requestUrl.origin)
    successUrl.searchParams.set('verified', 'true')
    return NextResponse.redirect(successUrl)
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
        const identities = supabaseUser.identities || []
        
        console.log('User identities:', identities.map(i => ({ provider: i.provider, id: i.id })))
        
        // Detect if this is OAuth-only user (no email/password identity)
        const isOAuthOnly = identities.length > 0 && identities.every(i => i.provider !== 'email')
        const oauthIdentity = identities.find(i => i.provider !== 'email')
        
        // Check if user exists in local database
        const existingUser = await db
          .select()
          .from(user)
          .where(eq(user.supabaseUserId, supabaseUser.id))
          .limit(1)

        // First-time OAuth user without local database record
        if (existingUser.length === 0 && isOAuthOnly && oauthIdentity) {
          console.log('🆕 First-time OAuth user detected:', oauthIdentity.provider)
          
          // Prepare user data for password setup page
          const providerData = {
            supabaseUserId: supabaseUser.id,
            email: supabaseUser.email,
            provider: oauthIdentity.provider,
            fullName: supabaseUser.user_metadata?.full_name || 
                     supabaseUser.user_metadata?.name ||
                     supabaseUser.user_metadata?.user_name,
            avatarUrl: supabaseUser.user_metadata?.avatar_url || 
                      supabaseUser.user_metadata?.picture ||
                      supabaseUser.user_metadata?.avatar,
          }
          
          // Redirect to password setup page
          const setupUrl = new URL('/en/onboarding/set-password', requestUrl.origin)
          setupUrl.searchParams.set('data', encodeURIComponent(JSON.stringify(providerData)))
          return NextResponse.redirect(setupUrl)
        }

        // User exists or has email identity - create/update local database record
        try {
          if (existingUser.length === 0) {
            // Create new user in local database
            console.log('Creating new user in local DB for Supabase user:', supabaseUser.id);
            
            // Get username and avatar from metadata
            const userName = supabaseUser.user_metadata?.username || 
                           supabaseUser.user_metadata?.user_name ||
                           supabaseUser.user_metadata?.full_name || 
                           supabaseUser.email!.split('@')[0];
            
            const userAvatar = supabaseUser.user_metadata?.avatar_url || 
                             supabaseUser.user_metadata?.picture ||
                             "/image/avatar/Milo.svg";
            
            // Build auth providers array from identities
            const authProviders = identities.map(identity => ({
              provider: identity.provider,
              providerId: identity.id,
              email: identity.identity_data?.email || supabaseUser.email,
              linkedAt: identity.created_at || new Date().toISOString(),
            }))
            
            await db.insert(user).values({
              supabaseUserId: supabaseUser.id,
              email: supabaseUser.email,
              emailVerified: supabaseUser.email_confirmed_at ? true : false,
              password: `supabase_${supabaseUser.id}`,
              userName: userName,
              userAvatar: userAvatar,
              defaultRole: "GUEST",
              hasPassword: identities.some(i => i.provider === 'email'),
              authProviders: authProviders as any,
            })

            console.log('✅ User created in local DB with', authProviders.length, 'auth provider(s)');
          } else {
            // User already exists - update their providers and info
            console.log('Updating existing user in local DB with new providers');
            
            // Build updated auth providers array
            const authProviders = identities.map(identity => ({
              provider: identity.provider,
              providerId: identity.id,
              email: identity.identity_data?.email || supabaseUser.email,
              linkedAt: identity.last_sign_in_at || new Date().toISOString(),
            }))
            
            await db
              .update(user)
              .set({ 
                email: supabaseUser.email,
                emailVerified: supabaseUser.email_confirmed_at ? true : false,
                userAvatar: supabaseUser.user_metadata?.avatar_url || 
                          supabaseUser.user_metadata?.picture ||
                          existingUser[0].userAvatar,
                hasPassword: identities.some(i => i.provider === 'email'),
                authProviders: authProviders as any,
                updatedAt: new Date(),
              })
              .where(eq(user.supabaseUserId, supabaseUser.id))
              
            console.log('✅ User updated with', authProviders.length, 'auth provider(s)');
          }
        } catch (dbError) {
          console.error('Database error during user creation/update:', dbError);
          // Continue with the flow even if database sync fails
        }

        // Redirect to success page
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