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

  console.log('🔍 Callback received:', { 
    code: !!code, 
    token_hash: !!token_hash, 
    type, 
    next,
    fullUrl: requestUrl.toString()
  })

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
      console.log('📝 Exchanging code for session...')
      console.log('🔑 Code received:', code.substring(0, 20) + '...')
      console.log('🌐 Request URL:', requestUrl.toString())
      
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Exchange code error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          code: error.code,
        })
        return NextResponse.redirect(
          new URL(`/en/auth/auth-code-error?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
        )
      }
      
      if (data.user) {
        const supabaseUser = data.user
        const identities = supabaseUser.identities || []
        
        console.log('✅ User authenticated via Supabase')
        console.log('👤 User ID:', supabaseUser.id)
        console.log('📧 Email:', supabaseUser.email)
        console.log('🔑 Identities:', identities.map(i => ({ provider: i.provider, id: i.id })))
        
        // Detect if this is OAuth-only user (no email/password identity)
        const isOAuthOnly = identities.length > 0 && identities.every(i => i.provider !== 'email')
        const oauthIdentity = identities.find(i => i.provider !== 'email')
        
        console.log('🔍 Is OAuth-only user:', isOAuthOnly)
        
        // Check if user exists in local database
        console.log('🔍 Checking if user exists in local database...')
        const existingUser = await db
          .select()
          .from(user)
          .where(eq(user.supabaseUserId, supabaseUser.id))
          .limit(1)

        console.log('📊 Existing user found:', existingUser.length > 0)

        // First-time OAuth user without local database record
        if (existingUser.length === 0 && isOAuthOnly && oauthIdentity) {
          console.log('🆕 First-time OAuth user detected:', oauthIdentity.provider)
          console.log('➡️  Redirecting to password setup page...')
          
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
            console.log('💾 Creating new user in local DB for Supabase user:', supabaseUser.id);
            
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
            
            console.log('📦 User data to insert:', {
              supabaseUserId: supabaseUser.id,
              email: supabaseUser.email,
              userName,
              hasPassword: identities.some(i => i.provider === 'email'),
              authProviders: authProviders.length,
            })
            
            const insertResult = await db.insert(user).values({
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

            console.log('✅ User created in local DB successfully with', authProviders.length, 'auth provider(s)');
            console.log('📊 Insert result:', insertResult);
          } else {
            // User already exists - update their providers and info
            console.log('🔄 Updating existing user in local DB');
            console.log('👤 Existing user:', existingUser[0].userName, '(', existingUser[0].email, ')');
            
            // Build updated auth providers array
            const authProviders = identities.map(identity => ({
              provider: identity.provider,
              providerId: identity.id,
              email: identity.identity_data?.email || supabaseUser.email,
              linkedAt: identity.last_sign_in_at || new Date().toISOString(),
            }))
            
            console.log('📦 Updating with providers:', authProviders.map(p => p.provider))
            
            const updateResult = await db
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
              
            console.log('✅ User updated successfully with', authProviders.length, 'auth provider(s)');
            console.log('📊 Update result:', updateResult);
          }
        } catch (dbError: any) {
          console.error('❌ DATABASE ERROR during user creation/update:');
          console.error('Error message:', dbError.message);
          console.error('Error code:', dbError.code);
          console.error('Full error:', dbError);
          // Continue with the flow even if database sync fails
        }

        // Redirect to success page
        console.log('✅ Callback complete, redirecting to:', next)
        return NextResponse.redirect(new URL(`${next}?verified=true`, requestUrl.origin))
      }
    } catch (exchangeError: any) {
      console.error('❌ FATAL: Exchange code error:', exchangeError);
      console.error('❌ Error stack:', exchangeError.stack);
      return NextResponse.redirect(
        new URL(`/en/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message || 'Unknown error')}`, requestUrl.origin)
      )
    }
  }

  // Redirect to error page with language prefix
  console.error('❌ No code or token_hash provided, redirecting to error')
  console.error('❌ Search params:', Object.fromEntries(requestUrl.searchParams))
  return NextResponse.redirect(new URL('/en/auth/auth-code-error?error=no_code', requestUrl.origin))
}