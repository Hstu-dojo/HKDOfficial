import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  createAccessToken,
  consumeAuthorizationCode,
  markAuthorizationCodeUsed,
  issueRefreshToken,
  rotateRefreshToken,
  isRegisteredClient,
  getRegisteredClientSecret,
  resolveExternalRoleByProfileId,
} from '@/lib/auth/external-auth';
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors';
import { enforceHttps, getRequestIp, rateLimit } from '@/lib/oauth2/security';

function parseUrlEncodedValue(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value : '';
}

function toBase64UrlSha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

function parseBasicAuth(request: NextRequest): { clientId: string; clientSecret: string } | null {
  const header = (request.headers.get('authorization') || '').trim();
  const match = header.match(/^Basic\s+(.+)$/i);
  if (!match) return null;

  try {
    const decoded = Buffer.from(match[1]!, 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx < 0) return null;
    return {
      clientId: decoded.slice(0, idx),
      clientSecret: decoded.slice(idx + 1),
    };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const json = (body: unknown, init?: ResponseInit) =>
    withExternalAuthCors(request, NextResponse.json(body, init));

  const https = enforceHttps(request);
  if (!https.ok) return withExternalAuthCors(request, https.response);

  // Rate limit: token endpoint is sensitive.
  const ip = getRequestIp(request);
  const rl = rateLimit(request, {
    key: `oauth2:token:${ip}`,
    windowMs: 60_000,
    max: 20,
  });
  if (!rl.ok) {
    const resp = NextResponse.json(
      { error: 'rate_limited', error_description: 'Too many requests' },
      { status: 429 }
    );
    resp.headers.set('Retry-After', String(rl.retryAfterSec));
    return withExternalAuthCors(request, resp);
  }

  const form = await request.formData();

  const grantType = parseUrlEncodedValue(form.get('grant_type'));
  const clientId = parseUrlEncodedValue(form.get('client_id'));
  const code = parseUrlEncodedValue(form.get('code'));
  const redirectUri = parseUrlEncodedValue(form.get('redirect_uri'));
  const codeVerifier = parseUrlEncodedValue(form.get('code_verifier'));
  const refreshToken = parseUrlEncodedValue(form.get('refresh_token'));
  const clientSecretForm = parseUrlEncodedValue(form.get('client_secret'));

  const basic = parseBasicAuth(request);
  if (basic && basic.clientId && basic.clientId !== clientId) {
    return json({ error: 'invalid_client' }, { status: 401 });
  }

  if (!isRegisteredClient(clientId)) {
    return json({ error: 'invalid_client' }, { status: 401 });
  }

  // If a client secret is configured for this client_id, treat it as confidential.
  const configuredSecret = getRegisteredClientSecret(clientId);
  if (configuredSecret) {
    const providedSecret = basic?.clientSecret || clientSecretForm;
    if (!providedSecret || providedSecret !== configuredSecret) {
      return json({ error: 'invalid_client' }, { status: 401 });
    }
  }

  if (grantType === 'authorization_code') {
    if (!code || !codeVerifier || !redirectUri) {
      return json({ error: 'invalid_request' }, { status: 400 });
    }

    const consumed = await consumeAuthorizationCode(code);
    if (!consumed.ok) {
      const desc =
        consumed.reason === 'expired'
          ? 'code expired'
          : consumed.reason === 'reused'
            ? 'code already used'
            : 'invalid code';
      return json({ error: 'invalid_grant', error_description: desc }, { status: 400 });
    }

    const codeRow = consumed.code;

    if (codeRow.clientId !== clientId) {
      return json({ error: 'invalid_grant', error_description: 'client mismatch' }, { status: 400 });
    }

    if (codeRow.redirectUri !== redirectUri) {
      return json(
        { error: 'invalid_grant', error_description: 'redirect_uri mismatch' },
        { status: 400 }
      );
    }

    if (codeRow.codeChallengeMethod !== 'S256') {
      return json(
        { error: 'invalid_grant', error_description: 'pkce method mismatch' },
        { status: 400 }
      );
    }

    const challenge = toBase64UrlSha256(codeVerifier);
    if (challenge !== codeRow.codeChallenge) {
      return json(
        { error: 'invalid_grant', error_description: 'pkce mismatch' },
        { status: 400 }
      );
    }

    const marked = await markAuthorizationCodeUsed(code);
    if (!marked) {
      return json(
        { error: 'invalid_grant', error_description: 'code already used' },
        { status: 400 }
      );
    }

    const roleContext = await resolveExternalRoleByProfileId(codeRow.userId);
    if (!roleContext.role) {
      return json(
        { error: 'invalid_grant', error_description: 'role missing' },
        { status: 400 }
      );
    }

    const accessToken = createAccessToken({
      userId: roleContext.profileId,
      role: roleContext.role,
      email: roleContext.email,
      clientId,
    });

    const scope = (codeRow.scope || '').trim();
    const scopeParts = scope.split(/\s+/).filter(Boolean);
    const shouldIssueRefresh = scopeParts.includes('offline_access');
    const ua = request.headers.get('user-agent');

    const refresh = shouldIssueRefresh
      ? await issueRefreshToken({
          userId: roleContext.profileId,
          clientId,
          userAgent: ua,
          ip,
        })
      : null;

    const responseBody: Record<string, unknown> = {
      access_token: accessToken.token,
      token_type: 'Bearer',
      expires_in: accessToken.expiresIn,
      scope,
    };

    if (refresh) {
      responseBody.refresh_token = refresh.token;
    }

    return json(responseBody);
  }

  if (grantType === 'refresh_token') {
    if (!refreshToken) {
      return json({ error: 'invalid_request' }, { status: 400 });
    }

    const ua = request.headers.get('user-agent');
    const rotated = await rotateRefreshToken({
      clientId,
      refreshToken,
      userAgent: ua,
      ip,
    });

    if (!rotated.ok) {
      return json({ error: 'invalid_grant' }, { status: 400 });
    }

    const roleContext = await resolveExternalRoleByProfileId(rotated.userId);
    if (!roleContext.role) {
      return json({ error: 'invalid_grant' }, { status: 400 });
    }

    const newAccessToken = createAccessToken({
      userId: roleContext.profileId,
      role: roleContext.role,
      email: roleContext.email,
      clientId,
    });

    return json({
      access_token: newAccessToken.token,
      refresh_token: rotated.refreshToken,
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
