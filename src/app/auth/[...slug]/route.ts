import { NextResponse } from 'next/server'

/**
 * Normalizes malformed auth callback URLs that accidentally place query params
 * in the pathname (e.g. `/auth/callback&token_hash=...&type=signup`).
 *
 * This route intentionally does NOT replace `/auth/callback` (handled by
 * `src/app/auth/callback/route.ts`). It only catches other `/auth/*` paths.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)

  // Typical bad shape:
  //   /auth/callback&token_hash=...&type=signup
  // Where `&...` should have been `?...`.
  if (url.pathname.startsWith('/auth/callback')) {
    const suffix = url.pathname.slice('/auth/callback'.length)

    // If the suffix looks like a query string glued onto the path, fix it.
    if (suffix.startsWith('&')) {
      const query = suffix.slice(1)
      const fixed = new URL('/auth/callback', url.origin)
      fixed.search = query ? `?${query}` : ''
      // Preserve any existing (rare) query params that might exist.
      url.searchParams.forEach((value, key) => {
        fixed.searchParams.set(key, value)
      })
      return NextResponse.redirect(fixed)
    }

    // If it's some other unknown callback-like path, send to canonical handler.
    if (suffix.length > 0) {
      const fixed = new URL('/auth/callback', url.origin)
      fixed.search = url.search
      return NextResponse.redirect(fixed)
    }
  }

  // Unknown /auth/* path. Send to the canonical callback handler (it will
  // route users appropriately based on available params).
  const fallback = new URL('/auth/callback', url.origin)
  fallback.search = url.search
  return NextResponse.redirect(fallback)
}
