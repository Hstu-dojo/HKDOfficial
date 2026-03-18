import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth/external-auth';
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors';

export async function POST(request: NextRequest) {
  const json = (body: unknown, init?: ResponseInit) =>
    withExternalAuthCors(request, NextResponse.json(body, init));

  const authHeader = (request.headers.get('authorization') || '').trim();
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const serviceToken = bearerMatch?.[1]?.trim() || '';

  const validServiceToken = (process.env.AUTH_SERVER_SERVICE_TOKEN || '').trim();

  if (!validServiceToken) {
    return json({ error: 'service_token_not_configured' }, { status: 500 });
  }

  if (!serviceToken) {
    return json({ error: 'missing_service_token' }, { status: 401 });
  }

  if (serviceToken !== validServiceToken) {
    return json({ error: 'invalid_service_token' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body?.token === 'string' ? body.token : '';

  if (!token) {
    return json({ error: 'invalid_request' }, { status: 400 });
  }

  const tokenData = getAccessToken(token);
  if (!tokenData) {
    return json({ active: false }, { status: 200 });
  }

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
