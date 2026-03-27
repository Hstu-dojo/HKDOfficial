import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

type Bucket = { count: number; resetAtMs: number }

declare global {
  var __hkd_oauth2_rateLimit: Map<string, Bucket> | undefined
}

function getBuckets(): Map<string, Bucket> {
  if (!globalThis.__hkd_oauth2_rateLimit) {
    globalThis.__hkd_oauth2_rateLimit = new Map<string, Bucket>()
  }
  return globalThis.__hkd_oauth2_rateLimit
}

export function getRequestIp(request: NextRequest): string {
  const xff = (request.headers.get('x-forwarded-for') || '').trim()
  if (xff) return xff.split(',')[0]!.trim()
  const realIp = (request.headers.get('x-real-ip') || '').trim()
  if (realIp) return realIp
  return 'unknown'
}

export function enforceHttps(request: NextRequest): { ok: true } | { ok: false; response: NextResponse } {
  if (process.env.NODE_ENV !== 'production') return { ok: true }

  const proto = (request.headers.get('x-forwarded-proto') || '').toLowerCase()
  if (proto === 'https') return { ok: true }

  return {
    ok: false,
    response: NextResponse.json(
      { error: 'invalid_request', error_description: 'HTTPS is required' },
      { status: 400 }
    ),
  }
}

export function rateLimit(request: NextRequest, opts: { key: string; windowMs: number; max: number }) {
  const buckets = getBuckets()
  const now = Date.now()
  const bucket = buckets.get(opts.key)
  if (!bucket || now >= bucket.resetAtMs) {
    buckets.set(opts.key, { count: 1, resetAtMs: now + opts.windowMs })
    return { ok: true as const }
  }

  if (bucket.count >= opts.max) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAtMs - now) / 1000))
    return { ok: false as const, retryAfterSec }
  }

  bucket.count += 1
  buckets.set(opts.key, bucket)
  return { ok: true as const }
}
