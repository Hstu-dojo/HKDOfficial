import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createAuthorizationCode,
  isPlaceholderState,
  isRegisteredClient,
  resolveExternalRoleBySupabaseUserId,
} from '@/lib/auth/external-auth';

export async function GET(request: NextRequest) {
  const canonicalOrigin = process.env.AUTH_CANONICAL_ORIGIN || 'https://www.hstuma.com';
  const url = request.nextUrl;
  const clientId = url.searchParams.get('client_id') ?? '';
  const redirectUri = url.searchParams.get('redirect_uri') ?? '';
  const responseType = url.searchParams.get('response_type') ?? '';
  const state = url.searchParams.get('state') ?? '';
  const codeChallenge = url.searchParams.get('code_challenge') ?? '';
  const codeChallengeMethod = url.searchParams.get('code_challenge_method') ?? '';

  if (!clientId || !redirectUri || responseType !== 'code' || !state || !codeChallenge) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  if (isPlaceholderState(state)) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Invalid state value' },
      { status: 400 }
    );
  }

  if (codeChallengeMethod !== 'S256') {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Only S256 supported' },
      { status: 400 }
    );
  }

  if (!isRegisteredClient(clientId)) {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 });
  }

  let callbackUrl: URL;
  try {
    callbackUrl = new URL(redirectUri);
  } catch {
    return NextResponse.json({ error: 'invalid_request', error_description: 'Invalid redirect_uri' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser?.id) {
    const loginUrl = new URL('/login', canonicalOrigin);
    loginUrl.searchParams.set('callbackUrl', `${canonicalOrigin}${request.nextUrl.pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const roleContext = await resolveExternalRoleBySupabaseUserId(authUser.id);
  if (!roleContext.profileId) {
    return NextResponse.json(
      {
        error: 'invalid_grant',
        error_description: 'Profile not found. A linked profile is required for external authentication.',
      },
      { status: 400 }
    );
  }

  if (!roleContext.role) {
    return NextResponse.json(
      {
        error: 'invalid_grant',
        error_description: 'Student level is not set. Ask admin/partner to assign your student level.',
      },
      { status: 400 }
    );
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
  return NextResponse.redirect(callbackUrl.toString());
}
