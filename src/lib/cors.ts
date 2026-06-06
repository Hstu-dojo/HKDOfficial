import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Allowed origins for CORS. Falls back to common dev/prod origins.
 * Set EXTERNAL_AUTH_ALLOWED_ORIGINS in .env to customise.
 */
const ALLOWED_ORIGINS: Set<string> = new Set(
  (process.env.EXTERNAL_AUTH_ALLOWED_ORIGINS || 'http://localhost:3000,https://www.hstuma.com')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
);

/**
 * Return CORS headers scoped to the given origin (only if it is allowlisted).
 * Returns null if the origin is not permitted.
 */
export function corsHeaders(requestOrigin?: string | null): Record<string, string> | null {
  const origin = requestOrigin?.trim();
  if (!origin) return null;

  // Check against exact matches in the allowlist
  let isAllowed = ALLOWED_ORIGINS.has(origin);

  // Check against wildcard *.hstuma.com and the root domain
  if (!isAllowed && (origin === 'https://hstuma.com' || (origin.startsWith('https://') && origin.endsWith('.hstuma.com')))) {
    isAllowed = true;
  }

  if (!isAllowed) {
    return null; // Not an allowed origin — don't attach CORS headers
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

export function handleCors(response: NextResponse, requestOrigin?: string | null) {
  const headers = corsHeaders(requestOrigin);
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

export function createCorsResponse(data: any, init?: ResponseInit, requestOrigin?: string | null) {
  const response = NextResponse.json(data, init);
  return handleCors(response, requestOrigin);
}

export function handleOptions(requestOrigin?: string | null) {
  const headers = corsHeaders(requestOrigin);
  if (!headers) {
    // Origin not allowed — return 403
    return new NextResponse(null, { status: 403 });
  }
  return new NextResponse(null, {
    status: 200,
    headers,
  });
}
