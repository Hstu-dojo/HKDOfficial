import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createAuthorizationCode,
  isPlaceholderState,
  isRegisteredClient,
  resolveExternalRoleBySupabaseUserId,
} from '@/lib/auth/external-auth';
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors';
import { enforceHttps } from '@/lib/oauth2/security';

export async function GET(request: NextRequest) {
  const json = (body: unknown, init?: ResponseInit) =>
    withExternalAuthCors(request, NextResponse.json(body, init));

  try {
    const https = enforceHttps(request);
    if (!https.ok) return withExternalAuthCors(request, https.response);

    const canonicalOrigin = process.env.AUTH_CANONICAL_ORIGIN || 'https://www.hstuma.com';
    const url = request.nextUrl;
    const clientId = url.searchParams.get('client_id') ?? '';
    const redirectUri = url.searchParams.get('redirect_uri') ?? '';
    const responseType = url.searchParams.get('response_type') ?? '';
    const scope = url.searchParams.get('scope') ?? '';
    const state = url.searchParams.get('state') ?? '';
    const codeChallenge = url.searchParams.get('code_challenge') ?? '';
    const codeChallengeMethod = url.searchParams.get('code_challenge_method') ?? '';

    if (!clientId || !redirectUri || responseType !== 'code' || !state || !codeChallenge) {
      return json({ error: 'invalid_request' }, { status: 400 });
    }

    if (isPlaceholderState(state)) {
      return json(
        { error: 'invalid_request', error_description: 'Invalid state value' },
        { status: 400 }
      );
    }

    if (codeChallengeMethod !== 'S256') {
      return json(
        { error: 'invalid_request', error_description: 'Only S256 supported' },
        { status: 400 }
      );
    }

    if (!isRegisteredClient(clientId)) {
      return json({ error: 'invalid_client' }, { status: 400 });
    }

    let callbackUrl: URL;
    try {
      callbackUrl = new URL(redirectUri);
    } catch {
      return json(
        { error: 'invalid_request', error_description: 'Invalid redirect_uri' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser?.id) {
      const loginUrl = new URL('/login', canonicalOrigin);
      loginUrl.searchParams.set(
        'callbackUrl',
        `${canonicalOrigin}${request.nextUrl.pathname}${request.nextUrl.search}`
      );
      return withExternalAuthCors(request, NextResponse.redirect(loginUrl));
    }

    const roleContext = await resolveExternalRoleBySupabaseUserId(authUser.id);
    if (!roleContext.profileId) {
      return json(
        {
          error: 'access_denied',
          error_description: 'Profile not found for this user',
        },
        { status: 403 }
      );
    }

    if (!roleContext.role) {
      return json(
        {
          error: 'access_denied',
          error_description: 'Role not configured for this user',
        },
        { status: 403 }
      );
    }

    const authCodeValue = await createAuthorizationCode({
      clientId,
      redirectUri,
      scope,
      userId: roleContext.profileId,
      codeChallenge,
      codeChallengeMethod: 'S256',
    });

    callbackUrl.searchParams.set('code', authCodeValue);
    callbackUrl.searchParams.set('state', state);
    return withExternalAuthCors(request, NextResponse.redirect(callbackUrl.toString()));
  } catch (error) {
    console.error('[oauth2/authorize] Unhandled error', error);
    return json(
      {
        error: 'server_error',
        error_description: 'Authorization server misconfigured or unavailable',
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return externalAuthOptions(request);
}
