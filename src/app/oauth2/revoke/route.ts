import { NextRequest, NextResponse } from 'next/server';
import { isRegisteredClient, revokeRefreshTokenByValue } from '@/lib/auth/external-auth';
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors';
import { enforceHttps, getRequestIp, rateLimit } from '@/lib/oauth2/security';

function parseUrlEncodedValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

export async function POST(request: NextRequest) {
  const json = (body: unknown, init?: ResponseInit) =>
    withExternalAuthCors(request, NextResponse.json(body, init));

  const https = enforceHttps(request);
  if (!https.ok) return withExternalAuthCors(request, https.response);

  const ip = getRequestIp(request);
  const rl = rateLimit(request, { key: `oauth2:revoke:${ip}`, windowMs: 60_000, max: 30 });
  if (!rl.ok) {
    const resp = NextResponse.json({ error: 'rate_limited' }, { status: 429 });
    resp.headers.set('Retry-After', String(rl.retryAfterSec));
    return withExternalAuthCors(request, resp);
  }

  const form = await request.formData();
  const token = parseUrlEncodedValue(form.get('token')) || parseUrlEncodedValue(form.get('refresh_token'));
  const clientId = parseUrlEncodedValue(form.get('client_id'));

  if (!isRegisteredClient(clientId)) {
    return json({ error: 'invalid_client' }, { status: 400 });
  }

  if (token) {
    await revokeRefreshTokenByValue(clientId, token);
  }

  return withExternalAuthCors(request, new NextResponse('', { status: 200 }));
}

export async function OPTIONS(request: NextRequest) {
  return externalAuthOptions(request);
}
