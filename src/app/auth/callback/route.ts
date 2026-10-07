import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/lib/connect-db'
import { user, registrations } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { ensureUserExists } from '@/lib/auth/user-sync'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const tenantRaw = requestUrl.searchParams.get('tenant')

  const tenant = (() => {
    if (!tenantRaw) return null
    const value = tenantRaw.trim().toLowerCase()
    if (!value) return null
    if (!/^[a-z0-9-]+$/.test(value)) return null
    return value
  })()

  const nextFromQuery = requestUrl.searchParams.get('next')
  const nextFromCookieRaw = (await cookies()).get('post_auth_next')?.value
  const nextFromCookie = nextFromCookieRaw ? decodeURIComponent(nextFromCookieRaw) : null

  const defaultNext = (() => {
    if (token_hash && type === 'recovery') return '/reset-password'
    if (token_hash && type === 'signup') return '/login'
    if (token_hash && type === 'email_change') return '/profile'
    if (code) return '/profile'
    return '/'
  })()

  const next = nextFromQuery ?? nextFromCookie ?? defaultNext

  function normalizeRedirectPath(url: URL): URL {
    const normalized = new URL(url.toString())
    // Defensive normalization: some flows can accidentally construct
    // /<locale>/dashboard/dashboard/... which should be /<locale>/dashboard/...
    normalized.pathname = normalized.pathname.replace(
      /\/dashboard\/dashboard(\/|$)/g,
      '/dashboard$1'
    )
    return normalized
  }

  function getSafeNextUrl(): URL {
    const fallback = new URL('/', requestUrl.origin)

    if (!next) return fallback

    try {
      const tenantBaseDomain = (process.env.TENANT_BASE_DOMAIN || 'p.hstuma.com').toLowerCase()
      const redirectBaseOrigin = tenant
        ? `${requestUrl.protocol}//${tenant}.${tenantBaseDomain}`
        : requestUrl.origin

      const nextUrl = next.startsWith('http://') || next.startsWith('https://')
        ? new URL(next)
        : new URL(next, redirectBaseOrigin)

      // Prevent open-redirects: only allow redirects back to our known domains.
      const rootDomain = (process.env.ROOT_DOMAIN || 'hstuma.com').toLowerCase()
      const host = nextUrl.hostname.toLowerCase()
      const isHttp = nextUrl.protocol === 'http:' || nextUrl.protocol === 'https:'

      const allowedHost =
        host === rootDomain ||
        host === `www.${rootDomain}` ||
        host === tenantBaseDomain ||
        host.endsWith(`.${tenantBaseDomain}`) ||
        host === requestUrl.hostname.toLowerCase()

      if (!isHttp || !allowedHost) return fallback
      return nextUrl
    } catch {
      return fallback
    }
  }

  const nextUrl = normalizeRedirectPath(getSafeNextUrl())

  console.log('🔍 Callback received:', { 
    code: !!code, 
    token_hash: !!token_hash, 
    type, 
    next,
    fullUrl: requestUrl.toString()
  })

  const supabase = await createClient()

  const clearNextCookie = (response: NextResponse) => {
    response.cookies.set('post_auth_next', '', { path: '/', maxAge: 0 })
    return response
  }

  // Handle password recovery with token_hash (PKCE flow for password reset)
  if (token_hash && type === 'recovery') {
    // IMPORTANT: Do not verify the recovery OTP on this callback host.
    // If we verify here (e.g. on www.<root>), Supabase session cookies are set
    // for that host only and won't be available on tenant subdomains.
    // Instead, forward the token_hash to the final destination and let the
    // reset-password page verify it client-side on the correct domain.

    const destination = new URL(nextUrl.toString())
    destination.searchParams.set('token_hash', token_hash)
    destination.searchParams.set('type', 'recovery')

    return clearNextCookie(NextResponse.redirect(destination))
  }

  // Handle signup confirmation with token_hash (PKCE flow)
  if (token_hash && type === 'signup') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email',
    })

    if (error) {
      console.error('Signup verification error:', error)
      return clearNextCookie(
        NextResponse.redirect(new URL('/en/auth/auth-code-error', requestUrl.origin))
      )
    }

    // Verification successful - create/sync user in local database
    if (data.user) {
      try {
        await ensureUserExists(data.user)
        console.log('✅ User synchronized in local DB after signup confirmation')
      } catch (dbError) {
        console.error('Database error during signup confirmation:', dbError)
      }
    }

    // Redirect to home page with verified flag - the login page/modal will show success message
    const successUrl = new URL(nextUrl.toString())
    successUrl.searchParams.set('verified', 'true')
    successUrl.searchParams.set('showLogin', 'true')
    return clearNextCookie(NextResponse.redirect(successUrl))
  }

  // Handle email change confirmation
  if (token_hash && type === 'email_change') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'email_change',
    })

    if (error) {
      const errorUrl = new URL(nextUrl.toString())
      errorUrl.searchParams.set('error', 'Email change verification failed: ' + error.message)
      return clearNextCookie(NextResponse.redirect(errorUrl))
    }

    // Email change successful - redirect to profile with success message
    const successUrl = new URL(nextUrl.toString())
    successUrl.searchParams.set('message', 'Email updated successfully!')
    successUrl.searchParams.set('sync_email', 'true') // Flag to trigger client-side sync
    return clearNextCookie(NextResponse.redirect(successUrl))
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
        return clearNextCookie(
          NextResponse.redirect(
            new URL(`/en/auth/auth-code-error?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
          )
        )
      }
      
      if (data.user) {
        const supabaseUser = data.user
        console.log('✅ User authenticated via Supabase:', supabaseUser.id, supabaseUser.email)
        
        let localUser: any = null
        try {
          localUser = await ensureUserExists(supabaseUser)
          console.log('✅ Local user synchronized successfully:', localUser?.id, localUser?.userName)
        } catch (dbError: any) {
          console.error('❌ DATABASE ERROR during ensureUserExists in auth callback:', dbError)
        }

        // Determine destination locale
        const segments = nextUrl.pathname.split('/').filter(Boolean)
        const locale = ['en', 'bn', 'ne'].includes(segments[0]) ? segments[0] : 'en'

        // Check if user has an existing onboarding registration
        let hasRegistration = false
        if (localUser?.id) {
          try {
            const reg = await db.query.registrations.findFirst({
              where: eq(registrations.userId, localUser.id),
            })
            hasRegistration = Boolean(reg)
          } catch (regErr) {
            console.warn('⚠️ Could not check existing registration:', regErr)
          }
        }

        // Determine destination:
        // If an explicit destination was passed (query or cookie), use it.
        // Otherwise:
        // - If user has not onboarded yet, take them directly to /onboarding
        // - If already registered, take them to /dashboard
        let finalRedirectUrl = nextUrl
        if (!nextFromQuery && !nextFromCookie) {
          if (!hasRegistration) {
            finalRedirectUrl = new URL(`/${locale}/onboarding`, requestUrl.origin)
          } else {
            finalRedirectUrl = new URL(`/${locale}/dashboard`, requestUrl.origin)
          }
        }

        // Redirect to destination
        console.log('✅ Auth callback complete, redirecting to:', finalRedirectUrl.toString())
        finalRedirectUrl.searchParams.set('verified', 'true')
        return clearNextCookie(NextResponse.redirect(finalRedirectUrl))
      }
    } catch (exchangeError: any) {
      console.error('❌ FATAL: Exchange code error:', exchangeError);
      console.error('❌ Error stack:', exchangeError.stack);
      return clearNextCookie(
        NextResponse.redirect(
          new URL(`/en/auth/auth-code-error?error=${encodeURIComponent(exchangeError.message || 'Unknown error')}`, requestUrl.origin)
        )
      )
    }
  }

  // Redirect to error page with language prefix
  console.error('❌ No code or token_hash provided, redirecting to error')
  console.error('❌ Search params:', Object.fromEntries(requestUrl.searchParams))
  return clearNextCookie(
    NextResponse.redirect(new URL('/en/auth/auth-code-error?error=no_code', requestUrl.origin))
  )
}