import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth/external-auth';
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors';

export async function POST(request: NextRequest) {
  const json = (body: unknown, init?: ResponseInit) =>
    withExternalAuthCors(request, NextResponse.json(body, init));

  // Log incoming request
  console.log('[introspect] POST request received');

  const authHeader = (request.headers.get('authorization') || '').trim();
  console.log('[introspect] Authorization header present:', !!authHeader);

  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const serviceToken = bearerMatch?.[1]?.trim() || '';

  console.log('[introspect] Service token parsed, first 20 chars:', serviceToken.substring(0, 20) || 'EMPTY');

  const validServiceToken = (process.env.AUTH_SERVER_SERVICE_TOKEN || '').trim();
  const configuredServiceToken = !!validServiceToken;

  console.log('[introspect] Service token configured:', configuredServiceToken);
  console.log('[introspect] Configured token first 20 chars:', validServiceToken.substring(0, 20) || 'EMPTY');

  if (!validServiceToken) {
    console.warn('[introspect] ERROR: service_token_not_configured');
    return json({ error: 'service_token_not_configured' }, { status: 500 });
  }

  if (!serviceToken) {
    console.warn('[introspect] ERROR: missing_service_token');
    return json({ error: 'missing_service_token' }, { status: 401 });
  }

  if (serviceToken !== validServiceToken) {
    console.warn('[introspect] ERROR: invalid_service_token - mismatch');
    console.warn('[introspect] Received:', serviceToken.substring(0, 20));
    console.warn('[introspect] Expected:', validServiceToken.substring(0, 20));
    return json({ error: 'invalid_service_token' }, { status: 403 });
  }

  console.log('[introspect] Service token validated successfully');

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch (e) {
    console.warn('[introspect] ERROR: Failed to parse JSON body');
    body = {};
  }

  const token = typeof body?.token === 'string' ? body.token : '';

  console.log('[introspect] Access token received, first 20 chars:', token.substring(0, 20) || 'EMPTY');
  console.log('[introspect] Access token length:', token.length);

  if (!token) {
    console.warn('[introspect] ERROR: invalid_request - no token in body');
    return json({ error: 'invalid_request' }, { status: 400 });
  }

  const tokenData = getAccessToken(token);

  if (!tokenData) {
    console.warn('[introspect] WARNING: Token not found in store or expired');
    console.warn('[introspect] Returning active: false');
    return json({ active: false }, { status: 200 });
  }

  console.log('[introspect] Token validated successfully');
  console.log('[introspect] Token profileId:', tokenData.userId);
  console.log('[introspect] Token email:', tokenData.email);
  console.log('[introspect] Token role:', tokenData.role);

  return json({
    active: true,
    userId: tokenData.userId,
    email: tokenData.email,
    role: tokenData.role,
  });
}

export async function OPTIONS(request: NextRequest) {
  return externalAuthOptions(request);
}
