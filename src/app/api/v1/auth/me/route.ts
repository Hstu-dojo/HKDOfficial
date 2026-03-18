import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/auth/external-auth';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : '';

  if (!token) {
    return NextResponse.json({ error: 'missing_token' }, { status: 401 });
  }

  const tokenData = getAccessToken(token);
  if (!tokenData) {
    return NextResponse.json({ error: 'invalid_token' }, { status: 401 });
  }

  return NextResponse.json({
    userId: tokenData.userId,
    email: tokenData.email,
    role: tokenData.role,
  });
}
