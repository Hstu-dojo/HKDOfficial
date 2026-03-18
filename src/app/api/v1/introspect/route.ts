import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth/external-auth';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const serviceToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : '';

  const validServiceToken = process.env.AUTH_SERVER_SERVICE_TOKEN || '';
  if (!validServiceToken || serviceToken !== validServiceToken) {
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
