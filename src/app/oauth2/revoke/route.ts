import { NextRequest, NextResponse } from 'next/server';
import { isRegisteredClient, revokeRefreshToken } from '@/lib/auth/external-auth';

function parseUrlEncodedValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const token = parseUrlEncodedValue(form.get('token'));
  const clientId = parseUrlEncodedValue(form.get('client_id'));

  if (!isRegisteredClient(clientId)) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 });
  }

  if (token) {
    revokeRefreshToken(token);
  }

  return new NextResponse('', { status: 200 });
}
