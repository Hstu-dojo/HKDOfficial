import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth/external-auth';
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors';

export async function GET(request: NextRequest) {
  const json = (body: unknown, init?: ResponseInit) =>
    withExternalAuthCors(request, NextResponse.json(body, init));

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    return json({ error: 'missing_token' }, { status: 401 });
  }

  const tokenData = getAccessToken(token);
  if (!tokenData) {
    return json({ error: 'invalid_token' }, { status: 401 });
  }

  return json({
    userId: tokenData.userId,
    email: tokenData.email,
    role: tokenData.role,
  });
}

export async function OPTIONS(request: NextRequest) {
  return externalAuthOptions(request);
}
