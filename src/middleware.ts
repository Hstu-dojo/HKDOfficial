import { createNEMO } from "@rescale/nemo";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withLocaleMiddleware } from "./middlewares/internationalization";
import { withAuthMiddleware } from "./middlewares/authentication";
import { withAdminMiddleware } from "./middlewares/admin";

const TENANT_BASE_DOMAIN = process.env.TENANT_BASE_DOMAIN || "p.hstuma.com";
const ROOT_DOMAIN = process.env.ROOT_DOMAIN || "hstuma.com";

/**
 * Intercept the (.)login pattern that leaks from the @loginDialogue
 * intercepting route into partner-admin URLs. Redirect cleanly to /partner-admin.
 */
function withPartnerAdminFix(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Catch /partner-admin/(.)login or any encoded variant
  if (
    pathname.includes('(.)login') ||
    pathname.includes('%28.%29login')
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/partner-admin';
    url.search = ''; // strip ?redirect= too
    return NextResponse.redirect(url);
  }

  // Strip the (.)login from the redirect query parameter
  const redirectParam = request.nextUrl.searchParams.get('redirect');
  if (
    pathname.startsWith('/partner-admin') &&
    redirectParam &&
    (redirectParam.includes('(.)login') || redirectParam.includes('%28.%29login'))
  ) {
    const url = request.nextUrl.clone();
    url.searchParams.set('redirect', '/partner-admin');
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function getHostname(request: NextRequest): string {
  const host = request.headers.get("host") || "";
  return host.toLowerCase().split(":")[0] || "";
}

function getTenantFromHost(hostname: string): string | null {
  // Match: <tenant>.p.hstuma.com
  const suffix = `.${TENANT_BASE_DOMAIN}`;
  if (!hostname.endsWith(suffix)) return null;
  const subdomainPart = hostname.slice(0, -suffix.length);
  if (!subdomainPart) return null;
  // Disallow obvious non-tenant subdomains
  if (["www", "app", "api"].includes(subdomainPart)) return null;
  return subdomainPart;
}

function withTenantRouting(request: NextRequest): NextResponse | null {
  const hostname = getHostname(request);
  const pathname = request.nextUrl.pathname;

  // 1) Tenant subdomain: rewrite to the existing /org/[slug] route
  const tenant = getTenantFromHost(hostname);
  if (tenant) {
    // If the tenant domain already requests an internal org path, don't rewrite again.
    if (pathname.startsWith("/org/")) return null;
    const url = request.nextUrl.clone();
    // Map:
    //   orgName.p.hstuma.com/        -> /org/orgName
    //   orgName.p.hstuma.com/foo    -> /org/orgName/foo
    const suffixPath = pathname === "/" ? "" : pathname;
    url.pathname = `/org/${tenant}${suffixPath}`;
    return NextResponse.rewrite(url);
  }

  // 2) Legacy path-based org URL on the main domain: redirect to tenant subdomain
  //    hstuma.com/org/orgName[/...] -> orgName.p.hstuma.com[/...]
  const isRootDomain =
    hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`;
  if (isRootDomain) {
    const match = pathname.match(/^\/org\/([^\/]+)(\/.*)?$/);
    if (match) {
      const slug = match[1];
      const rest = match[2] || "/";

      const url = request.nextUrl.clone();
      url.hostname = `${slug}.${TENANT_BASE_DOMAIN}`;
      url.pathname = rest;
      return NextResponse.redirect(url);
    }
  }

  return null;
}

const middlewares = {
  // ── Locale-rewritten routes (i18n) ──────────────────────────
  // IMPORTANT: Do NOT add a catch-all "/:locale" pattern here!
  // It matches every single-segment path (/docs, /blog, /studio, etc.)
  // and incorrectly applies locale rewriting to them.
  // Instead, list each locale root explicitly:
  "/": withLocaleMiddleware,
  "/en": withLocaleMiddleware,
  "/bn": withLocaleMiddleware,
  "/ne": withLocaleMiddleware,
  "/about": withLocaleMiddleware,
  "/gallery": withLocaleMiddleware,
  "/pricing": withLocaleMiddleware,
  "/services": withLocaleMiddleware,
  "/services/:path*": withLocaleMiddleware,

  // Admin routes — require admin-level roles (both with and without locale prefix)
  "/admin": [withLocaleMiddleware, withAdminMiddleware],
  "/admin/:path*": [withLocaleMiddleware, withAdminMiddleware],
  "/:locale/admin": [withAdminMiddleware],
  "/:locale/admin/:path*": [withAdminMiddleware],

  // Dashboard routes - require authentication
  "/dashboard": [withLocaleMiddleware, withAuthMiddleware],
  "/dashboard/:path*": [withLocaleMiddleware, withAuthMiddleware],
  "/:locale/dashboard": [withAuthMiddleware],
  "/:locale/dashboard/:path*": [withAuthMiddleware],

  // Karate routes - public listing, auth-required for apply
  "/karate/courses": withLocaleMiddleware,
  "/karate/courses/:slug": withLocaleMiddleware,
  "/karate/courses/:slug/apply": [withLocaleMiddleware, withAuthMiddleware],
  "/karate/courses/:slug/apply/:path*": [
    withLocaleMiddleware,
    withAuthMiddleware,
  ],
  "/:locale/karate/courses/:slug/apply": [withAuthMiddleware],
  "/:locale/karate/courses/:slug/apply/:path*": [withAuthMiddleware],
  "/karate/courses/:path*": withLocaleMiddleware,
  "/karate/programs": withLocaleMiddleware,
  "/karate/programs/:path*": withLocaleMiddleware,

  // Also support direct /courses and /programs routes
  "/courses": withLocaleMiddleware,
  "/courses/:path*": withLocaleMiddleware,
  "/programs": withLocaleMiddleware,
  "/programs/:path*": withLocaleMiddleware,

  // Protected routes - require authentication
  "/apply/:path*": [withLocaleMiddleware, withAuthMiddleware],
  "/profile": [withLocaleMiddleware, withAuthMiddleware],
  "/[slug]/profile": [withLocaleMiddleware, withAuthMiddleware],
  "/onboarding": [withLocaleMiddleware, withAuthMiddleware],
  "/onboarding/:path*": [withLocaleMiddleware, withAuthMiddleware],
  "/[slug]/onboarding": [withLocaleMiddleware, withAuthMiddleware],
  "/[slug]/onboarding/:path*": [withLocaleMiddleware, withAuthMiddleware],

  // Public routes
  "/dev": withLocaleMiddleware,
  "/login": withLocaleMiddleware,
  "/register": withLocaleMiddleware,
  "/contact": withLocaleMiddleware,
  "/posts": withLocaleMiddleware,
  "/cert-verify": withLocaleMiddleware,
  "/posts/:path*": withLocaleMiddleware,
  "/search": withLocaleMiddleware,
  "/forget": withLocaleMiddleware,
  "/reset-password": withLocaleMiddleware,
  "/avatar": withLocaleMiddleware,
  "/auth-debug": withLocaleMiddleware,
  "/auth-debug/:path*": withLocaleMiddleware,

  // Locale-prefixed routes (for client-side navigation after locale is set)
  "/:locale/about": withLocaleMiddleware,
  "/:locale/gallery": withLocaleMiddleware,
  "/:locale/pricing": withLocaleMiddleware,
  "/:locale/services": withLocaleMiddleware,
  "/:locale/services/:path*": withLocaleMiddleware,
  "/:locale/login": withLocaleMiddleware,
  "/:locale/register": withLocaleMiddleware,
  "/:locale/contact": withLocaleMiddleware,
  "/:locale/dev": withLocaleMiddleware,
  "/:locale/posts": withLocaleMiddleware,
  "/:locale/posts/:path*": withLocaleMiddleware,
  "/:locale/search": withLocaleMiddleware,
  "/:locale/forget": withLocaleMiddleware,
  "/:locale/reset-password": withLocaleMiddleware,
  "/:locale/avatar": withLocaleMiddleware,
  "/:locale/karate/courses": withLocaleMiddleware,
  "/:locale/karate/courses/:slug": withLocaleMiddleware,
  "/:locale/karate/courses/:path*": withLocaleMiddleware,
  "/:locale/karate/programs": withLocaleMiddleware,
  "/:locale/karate/programs/:path*": withLocaleMiddleware,
  "/:locale/courses": withLocaleMiddleware,
  "/:locale/courses/:path*": withLocaleMiddleware,
  "/:locale/programs": withLocaleMiddleware,
  "/:locale/programs/:path*": withLocaleMiddleware,

  // Docs routes — admin-only, NO locale rewriting (served by Nextra / Pages Router)
  "/docs": withAdminMiddleware,
  "/docs/:path*": withAdminMiddleware,
};

// Create middlewares helper
const nemoMiddleware = createNEMO(middlewares);

export async function middleware(request: NextRequest) {
  // Subdomain multitenancy (run before everything else)
  const tenantResult = withTenantRouting(request);
  if (tenantResult) return tenantResult;

  // Always run the partner-admin fix first for any matched route
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/partner-admin')) {
    const fixResult = withPartnerAdminFix(request);
    if (fixResult.status === 307 || fixResult.status === 308) {
      return fixResult; // redirect was triggered
    }
    // For normal /partner-admin routes, let Payload handle them (no NEMO processing)
    return NextResponse.next();
  }

  // All other routes go through NEMO middleware chain
  return nemoMiddleware(request, {} as any);
}

export const config = {
  /*
   * Match all paths except for:
   * 1. /api/ routes
   * 2. /auth/ routes (Supabase authentication callbacks)
   * 3. /_next/ (Next.js internals)
   * 4. /_static (inside /public)
   * 5. /_vercel (Vercel internals)
   * 6. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
   * Note: partner-admin is NOW included so we can fix the (.)login redirect,
   *       but normal partner-admin routes pass through untouched.
   */
  matcher: [
    // NOTE: /docs is intentionally NOT excluded — it needs withAdminMiddleware.
    // Routes like /blog, /unauthorized, /studio etc. need no middleware at all.
    "/((?!api|payload-api|auth|static|blog|unauthorized|studio|notice|p|.*\\..*|_next|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
