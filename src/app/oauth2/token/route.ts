import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  consumeAuthorizationCode,
  createAccessToken,
  createRefreshToken,
  getRefreshToken,
  isRegisteredClient,
} from '@/lib/auth/external-auth';

function parseUrlEncodedValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

function toBase64UrlSha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

export async function POST(request: NextRequest) {
  const form = await request.formData();

  const grantType = parseUrlEncodedValue(form.get('grant_type'));
  const clientId = parseUrlEncodedValue(form.get('client_id'));
  const code = parseUrlEncodedValue(form.get('code'));
  const codeVerifier = parseUrlEncodedValue(form.get('code_verifier'));
  const refreshToken = parseUrlEncodedValue(form.get('refresh_token'));

  if (!isRegisteredClient(clientId)) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 401 });
  }

  if (grantType === 'authorization_code') {
    if (!code || !codeVerifier) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const codeContext = consumeAuthorizationCode(code);
    if (!codeContext) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    const challenge = toBase64UrlSha256(codeVerifier);
    if (challenge !== codeContext.codeChallenge) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'pkce mismatch' },
        { status: 400 }
      );
    }

    const accessToken = createAccessToken({
      userId: codeContext.userId,
      role: codeContext.role,
      email: codeContext.email,
      clientId,
    });

    const refreshTokenValue = createRefreshToken({
      userId: codeContext.userId,
      role: codeContext.role,
      email: codeContext.email,
    });

    return NextResponse.json({
      access_token: accessToken.token,
      refresh_token: refreshTokenValue,
      token_type: 'Bearer',
      expires_in: accessToken.expiresIn,
      scope: 'openid profile email offline_access',
    });
  }

  if (grantType === 'refresh_token') {
    if (!refreshToken) {
      return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
    }

    const refreshCtx = getRefreshToken(refreshToken);
    if (!refreshCtx) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    const newAccessToken = createAccessToken({
      userId: refreshCtx.userId,
      role: refreshCtx.role,
      email: refreshCtx.email,
      clientId,
    });

    return NextResponse.json({
      access_token: newAccessToken.token,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: newAccessToken.expiresIn,
      scope: 'openid profile email offline_access',
    });
  }

  return NextResponse.json({ error: 'unsupported_grant_type' }, { status: 400 });
}
