import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { resolveExternalRoleBySupabaseUserId, createAccessToken } from '@/lib/auth/external-auth';

/**
 * API endpoint for seamless Single Sign-On (SSO) to the external web portal.
 * Verifies the user session securely and redirects to the portal with an access token.
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate via Supabase session (server-side)
    const supabase = await createClient();
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser?.id) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', '/dashboard/apk-download');
      return NextResponse.redirect(loginUrl);
    }

    // 2. Resolve external role (admin, teacher, or student_X_kyu)
    const { profileId, email, role } = await resolveExternalRoleBySupabaseUserId(authUser.id);

    if (!profileId || !role) {
      return NextResponse.json({ error: 'Could not resolve user role or profile' }, { status: 403 });
    }

    // 3. Generate a secure, short-lived JWT token
    const tokenPayload = createAccessToken({
      userId: profileId,
      email: email,
      role: role,
      clientId: 'dojo-app',
    });

    // 4. Redirect to the portal with the token
    const targetUrl = new URL('https://portal.hstuma.com/');
    targetUrl.searchParams.set('access_token', tokenPayload.token);

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error('[portal-sso] Error generating SSO token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
