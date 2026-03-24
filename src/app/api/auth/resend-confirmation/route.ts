import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

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
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${callbackOrigin}/auth/callback?next=${encodeURIComponent(
          `${origin}/login`
        )}`
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