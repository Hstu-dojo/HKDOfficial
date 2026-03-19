import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  createAccessToken,
  createRefreshToken,
  getAuthorizationCodeContext,
  getRefreshToken,
  invalidateAuthorizationCode,
  isRegisteredClient,
} from '@/lib/auth/external-auth';
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors';

function parseUrlEncodedValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

function toBase64UrlSha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

export async function POST(request: NextRequest) {
  const json = (body: unknown, init?: ResponseInit) =>
    withExternalAuthCors(request, NextResponse.json(body, init));

  const form = await request.formData();

  const grantType = parseUrlEncodedValue(form.get('grant_type'));
  const clientId = parseUrlEncodedValue(form.get('client_id'));
  const code = parseUrlEncodedValue(form.get('code'));
  const state = parseUrlEncodedValue(form.get('state'));
  const redirectUri = parseUrlEncodedValue(form.get('redirect_uri'));
  const codeVerifier = parseUrlEncodedValue(form.get('code_verifier'));
  const refreshToken = parseUrlEncodedValue(form.get('refresh_token'));

  if (!isRegisteredClient(clientId)) {
    return json({ error: 'invalid_client' }, { status: 401 });
  }

  if (grantType === 'authorization_code') {
    if (!code || !codeVerifier || !redirectUri || !state) {
      return json({ error: 'invalid_request' }, { status: 400 });
    }

    const codeContextResult = getAuthorizationCodeContext(code);
    if (!codeContextResult.ok) {
      if (codeContextResult.reason === 'expired') {
        return json(
          { error: 'invalid_grant', error_description: 'code expired' },
          { status: 400 }
        );
      }

      if (codeContextResult.reason === 'reused') {
        return json(
          { error: 'invalid_grant', error_description: 'code already used' },
          { status: 400 }
        );
      }

      return json({ error: 'invalid_grant' }, { status: 400 });
    }

    const codeContext = codeContextResult.context;

    if (codeContext.clientId !== clientId) {
      return json({ error: 'invalid_grant' }, { status: 400 });
    }

    if (codeContext.redirectUri !== redirectUri) {
      return json(
        { error: 'invalid_grant', error_description: 'redirect_uri mismatch' },
        { status: 400 }
      );
    }

    if (codeContext.state !== state) {
      return json(
        { error: 'invalid_grant', error_description: 'state mismatch' },
        { status: 400 }
      );
    }

    const challenge = toBase64UrlSha256(codeVerifier);
    if (challenge !== codeContext.codeChallenge) {
      return json(
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

    invalidateAuthorizationCode(code);

    return json({
      access_token: accessToken.token,
      refresh_token: refreshTokenValue,
      token_type: 'Bearer',
      expires_in: accessToken.expiresIn,
      scope: 'openid profile email offline_access',
    });
  }

  if (grantType === 'refresh_token') {
    if (!refreshToken) {
      return json({ error: 'invalid_request' }, { status: 400 });
    }

    const refreshCtx = getRefreshToken(refreshToken);
    if (!refreshCtx) {
      return json({ error: 'invalid_grant' }, { status: 400 });
    }

    const newAccessToken = createAccessToken({
      userId: refreshCtx.userId,
      role: refreshCtx.role,
      email: refreshCtx.email,
      clientId,
    });

    return json({
      access_token: newAccessToken.token,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: newAccessToken.expiresIn,
      scope: 'openid profile email offline_access',
    });
  }

  return json({ error: 'unsupported_grant_type' }, { status: 400 });
}

export async function OPTIONS(request: NextRequest) {
  return externalAuthOptions(request);
}
