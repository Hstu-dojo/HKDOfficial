import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth/external-auth';

export async function POST(request: NextRequest) {
  const authHeader = (request.headers.get('authorization') || '').trim();
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const serviceToken = bearerMatch?.[1]?.trim() || '';

  const validServiceToken = (process.env.AUTH_SERVER_SERVICE_TOKEN || '').trim();

  if (!validServiceToken) {
    return NextResponse.json({ error: 'service_token_not_configured' }, { status: 500 });
  }

  if (!serviceToken) {
    return NextResponse.json({ error: 'missing_service_token' }, { status: 401 });
  }

  if (serviceToken !== validServiceToken) {
    return NextResponse.json({ error: 'invalid_service_token' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body?.token === 'string' ? body.token : '';

  if (!token) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const tokenData = getAccessToken(token);
  if (!tokenData) {
    return NextResponse.json({ active: false }, { status: 200 });
  }

  return NextResponse.json({
    active: true,
    userId: tokenData.userId,
    email: tokenData.email,
    role: tokenData.role,
  });
}
