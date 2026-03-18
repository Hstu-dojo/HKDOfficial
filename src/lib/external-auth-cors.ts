import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:8081',
  'https://hstuma.onrender.com',
  'https://hstukarate.vercel.app',
  'https://www.hstuma.com',
  'https://hstuma.com',
];

function getAllowedOrigins() {
  const envOrigins = (process.env.EXTERNAL_AUTH_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...envOrigins]);
}

function pickCorsOrigin(request: NextRequest) {
  const requestOrigin = (request.headers.get('origin') || '').trim();
  if (!requestOrigin) return null;
  const allowedOrigins = getAllowedOrigins();
  return allowedOrigins.has(requestOrigin) ? requestOrigin : null;
}

export function withExternalAuthCors(request: NextRequest, response: NextResponse) {
  const allowOrigin = pickCorsOrigin(request);

  response.headers.set('Vary', 'Origin');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Authorization, Content-Type, X-Requested-With, Accept, Origin'
  );
  response.headers.set('Access-Control-Max-Age', '600');

  if (allowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export function externalAuthOptions(request: NextRequest) {
  const allowOrigin = pickCorsOrigin(request);

  if (!allowOrigin && request.headers.get('origin')) {
    return new NextResponse(null, { status: 403 });
  }

  const response = new NextResponse(null, { status: 204 });
  return withExternalAuthCors(request, response);
}
