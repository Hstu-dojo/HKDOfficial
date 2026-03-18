import { NextRequest, NextResponse } from 'next/server';
import { isRegisteredClient, revokeRefreshToken } from '@/lib/auth/external-auth';
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors';

function parseUrlEncodedValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

export async function POST(request: NextRequest) {
  const json = (body: unknown, init?: ResponseInit) =>
    withExternalAuthCors(request, NextResponse.json(body, init));

  const form = await request.formData();
  const token = parseUrlEncodedValue(form.get('token'));
  const clientId = parseUrlEncodedValue(form.get('client_id'));

  if (!isRegisteredClient(clientId)) {
    return json({ error: 'invalid_client' }, { status: 400 });
  }

  if (token) {
    revokeRefreshToken(token);
  }

  return withExternalAuthCors(request, new NextResponse('', { status: 200 }));
}

export async function OPTIONS(request: NextRequest) {
  return externalAuthOptions(request);
}
