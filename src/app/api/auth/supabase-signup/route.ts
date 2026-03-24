import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { createUser } from '@/lib/db/user'
import { hash } from '@/lib/hash'

function getLocaleFromReferer(request: NextRequest): string | null {
  const referer = request.headers.get('referer')
  if (!referer) return null
  try {
    const url = new URL(referer)
    const firstSeg = url.pathname.split('/')[1] || ''
    if (/^[a-z]{2}(-[A-Z]{2})?$/.test(firstSeg)) return firstSeg
    return null
  } catch {
    return null
  }
}

function getTenantSlugFromRequest(request: NextRequest): string | null {
  const tenantBaseDomain = (process.env.TENANT_BASE_DOMAIN || 'p.hstuma.com').toLowerCase()
  const suffix = `.${tenantBaseDomain}`

  const candidates = [
    request.headers.get('x-forwarded-host'),
    request.headers.get('host'),
    request.nextUrl.host,
  ]
    .filter(Boolean)
    .map((h) => (h as string).split(',')[0]!.trim().toLowerCase())

  for (const host of candidates) {
    if (!host.endsWith(suffix)) continue
    const slug = host.slice(0, -suffix.length)
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) continue
    return slug
  }

  return null
}

function getOrigin(request: NextRequest): string {
  const forwardedHostRaw = request.headers.get('x-forwarded-host')
  const hostRaw = request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto')

  // Some proxies send comma-separated values; the first entry is the original.
  const forwardedHost = forwardedHostRaw?.split(',')[0]?.trim()
  const host = hostRaw?.split(',')[0]?.trim()

  const isInternalHost = (value: string) =>
    value.endsWith('.vercel.app') || value.endsWith('.now.sh')

  // Prefer the actual Host header (what the user typed). If it looks internal,
  // fall back to x-forwarded-host.
  const resolvedHost =
    host && !isInternalHost(host)
      ? host
      : (forwardedHost || host || request.nextUrl.host)

  if (!resolvedHost) return request.nextUrl.origin

  const proto = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'https'
  return `${proto}://${resolvedHost}`
}

function getAuthCallbackOrigin(request: NextRequest): string {
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const proto = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'https'

  const rootDomain = (process.env.ROOT_DOMAIN || 'hstuma.com').toLowerCase()
  const wwwRoot = `www.${rootDomain}`

  const hostRaw = request.headers.get('host')
  const host = hostRaw?.split(',')[0]?.trim().toLowerCase()
  const isRootRequest = host === rootDomain || host === wwwRoot

  const callbackHost = isRootRequest ? (host || wwwRoot) : wwwRoot
  return `${proto}://${callbackHost}`
}

function getCanonicalOrigin(request: NextRequest): string {
  const host = (request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host || '').toLowerCase()
  const forwardedProto = request.headers.get('x-forwarded-proto')
  const proto = forwardedProto || request.nextUrl.protocol.replace(':', '') || 'https'

  if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return request.nextUrl.origin
  }

  const rootDomain = process.env.ROOT_DOMAIN || 'hstuma.com'
  return `${proto}://${rootDomain}`
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, userName, userAvatar } = await request.json()

    if (!email || !password || !userName) {
      return NextResponse.json(
        { error: 'Email, password, and username are required' },
        { status: 400 }
      )
    }

    // Sign up user with Supabase Auth
    const supabase = createClient();
    const origin = getOrigin(request)
    const callbackOrigin = getAuthCallbackOrigin(request)

    const locale = getLocaleFromReferer(request)
    const nextPath = locale ? `/${locale}/login` : '/login'
    const tenant = getTenantSlugFromRequest(request)
    const emailRedirectUrl = new URL('/auth/callback', callbackOrigin)
    if (tenant) emailRedirectUrl.searchParams.set('tenant', tenant)
    emailRedirectUrl.searchParams.set('next', nextPath)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userName,
          avatar_url: userAvatar,
        },
        // Use canonical callback origin and hop to the tenant via `next=`.
        emailRedirectTo: emailRedirectUrl.toString(),
      }
    })

    if (authError) {
      console.error('Supabase Auth Error:', authError)
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 400 }
      )
    }

    // Create user in your database (optional - you might want to do this via database triggers)
    try {
      const hashedPassword = await hash(password)
      await createUser({
        email,
        password: hashedPassword,
        userName,
        userAvatar,
      })
    } catch (dbError) {
      console.error('Database Error:', dbError)
      // User created in Supabase but failed to create in local DB
      // You might want to handle this differently based on your needs
    }

    return NextResponse.json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        emailVerified: authData.user.email_confirmed_at !== null
      }
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}