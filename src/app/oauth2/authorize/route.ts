import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createAuthorizationCode,
  isPlaceholderState,
  isRegisteredClient,
  resolveExternalRoleBySupabaseUserId,
} from '@/lib/auth/external-auth';
import { externalAuthOptions, withExternalAuthCors } from '@/lib/external-auth-cors';

export async function GET(request: NextRequest) {
  const json = (body: unknown, init?: ResponseInit) =>
    withExternalAuthCors(request, NextResponse.json(body, init));

  const canonicalOrigin = process.env.AUTH_CANONICAL_ORIGIN || 'https://www.hstuma.com';
  const url = request.nextUrl;
  const clientId = url.searchParams.get('client_id') ?? '';
  const redirectUri = url.searchParams.get('redirect_uri') ?? '';
  const responseType = url.searchParams.get('response_type') ?? '';
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
    return json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    const loginUrl = new URL('/login', canonicalOrigin);
    loginUrl.searchParams.set('callbackUrl', `${canonicalOrigin}${request.nextUrl.pathname}${request.nextUrl.search}`);
    return withExternalAuthCors(request, NextResponse.redirect(loginUrl));
  }

  const roleContext = await resolveExternalRoleBySupabaseUserId(authUser.id);
  if (!roleContext.profileId) {
    const errorUrl = new URL('/en/oauth-error', canonicalOrigin);
    errorUrl.searchParams.set('error', 'profile_not_found');
    return withExternalAuthCors(request, NextResponse.redirect(errorUrl));
  }

  if (!roleContext.role) {
    const errorUrl = new URL('/en/oauth-error', canonicalOrigin);
    errorUrl.searchParams.set('error', 'role_missing');
    return withExternalAuthCors(request, NextResponse.redirect(errorUrl));
  }

  const authCode = createAuthorizationCode({
    clientId,
    redirectUri,
    userId: roleContext.profileId,
    role: roleContext.role,
    email: roleContext.email,
    codeChallenge,
    state,
  });

  callbackUrl.searchParams.set('code', authCode);
  callbackUrl.searchParams.set('state', state);
  return withExternalAuthCors(request, NextResponse.redirect(callbackUrl.toString()));
}

export async function OPTIONS(request: NextRequest) {
  return externalAuthOptions(request);
}
