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

    // 4. Determine redirect strategy (Deep link vs Web)
    const webUrl = `https://portal.hstuma.com/?access_token=${tokenPayload.token}`;
    const userAgent = request.headers.get('user-agent') || '';
    const isAndroid = /android/i.test(userAgent);

    if (isAndroid) {
      // Android Intent scheme: gracefully falls back to webUrl if app is not installed
      const fallbackUrl = encodeURIComponent(webUrl);
      const intentUrl = `intent://?access_token=${tokenPayload.token}#Intent;scheme=dojoapprebuild;package=com.anonymous.dojo_app_rebuild;S.browser_fallback_url=${fallbackUrl};end`;
      return NextResponse.redirect(intentUrl);
    }

    return NextResponse.redirect(webUrl);
  } catch (error) {
    console.error('[portal-sso] Error generating SSO token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
