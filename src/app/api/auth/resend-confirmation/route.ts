import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

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

  // In local dev, keep everything on the same origin.
  if (host.includes('localhost') || host.startsWith('127.0.0.1')) {
    return request.nextUrl.origin
  }

  const rootDomain = process.env.ROOT_DOMAIN || 'hstuma.com'
  return `${proto}://${rootDomain}`
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Resend confirmation email
    const supabase = createClient();
    const origin = getOrigin(request)
    const callbackOrigin = getAuthCallbackOrigin(request)

    const locale = getLocaleFromReferer(request)
    const nextPath = locale ? `/${locale}/login` : '/login'
    const tenant = getTenantSlugFromRequest(request)
    const emailRedirectUrl = new URL('/auth/callback', callbackOrigin)
    if (tenant) emailRedirectUrl.searchParams.set('tenant', tenant)
    emailRedirectUrl.searchParams.set('next', nextPath)

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: emailRedirectUrl.toString(),
      }
    })

    if (error) {
      console.error('Supabase Resend Error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      message: 'Confirmation email sent successfully. Please check your inbox.'
    })

  } catch (error) {
    console.error('Resend confirmation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}