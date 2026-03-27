import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { enforceHttps, getRequestIp, rateLimit } from '@/lib/oauth2/security'
import { getAccessToken, isAccessTokenInvalidated } from '@/lib/auth/external-auth'

async function parseTokenFromRequest(request: NextRequest): Promise<string> {
  const contentType = (request.headers.get('content-type') || '').toLowerCase()
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const form = await request.formData()
    const token = form.get('token')
    return typeof token === 'string' ? token : ''
  }

  try {
    const body = (await request.json()) as any
    return typeof body?.token === 'string' ? body.token : ''
  } catch {
    return ''
  }
}

export async function handleOAuth2Introspect(request: NextRequest): Promise<NextResponse> {
  const https = enforceHttps(request)
  if (!https.ok) return https.response

  // Rate limit by IP (and service token prefix if present).
  const ip = getRequestIp(request)
  const authHeader = (request.headers.get('authorization') || '').trim()
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i)
  const serviceToken = bearerMatch?.[1]?.trim() || ''
  const tokenKeyPrefix = serviceToken ? serviceToken.slice(0, 12) : 'no-service-token'

  const rl = rateLimit(request, {
    key: `oauth2:introspect:${tokenKeyPrefix}:${ip}`,
    windowMs: 60_000,
    max: 3000,
  })
  if (!rl.ok) {
    const resp = NextResponse.json({ error: 'rate_limited' }, { status: 429 })
    resp.headers.set('Retry-After', String(rl.retryAfterSec))
    return resp
  }

  // Optional (but recommended) service token protection
  const validServiceToken = (process.env.AUTH_SERVER_SERVICE_TOKEN || '').trim()
  if (process.env.NODE_ENV === 'production' && !validServiceToken) {
    return NextResponse.json({ error: 'service_token_not_configured' }, { status: 500 })
  }

  if (validServiceToken) {
    if (!serviceToken) return NextResponse.json({ error: 'missing_service_token' }, { status: 401 })
    if (serviceToken !== validServiceToken) {
      return NextResponse.json({ error: 'invalid_service_token' }, { status: 403 })
    }
  }

  const token = (await parseTokenFromRequest(request)).trim()
  if (!token) return NextResponse.json({ error: 'invalid_request' }, { status: 400 })

  const tokenData = getAccessToken(token)
  if (!tokenData) return NextResponse.json({ active: false }, { status: 200 })

  const revoked = await isAccessTokenInvalidated({
    userId: tokenData.userId,
    clientId: tokenData.clientId,
    issuedAtMs: tokenData.issuedAt,
  })

  if (revoked) return NextResponse.json({ active: false }, { status: 200 })

  return NextResponse.json(
    {
      active: true,
      userId: tokenData.userId,
      role: tokenData.role,
      email: tokenData.email,
    },
    { status: 200 }
  )
}
