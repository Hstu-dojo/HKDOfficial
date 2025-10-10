import { createNEMO } from "@rescale/nemo";
import { withLocaleMiddleware } from "./middlewares/internationalization";
import { withAuthMiddleware } from "./middlewares/authentication";
import { withAdminMiddleware } from "./middlewares/admin";

const middlewares = {
  // define your middlewares here...
  // first internationalization, then auth middleware!
  "/": withLocaleMiddleware,
  // "/services": withLocaleMiddleware,
  // "/pricing": withLocaleMiddleware,
  "/about": withLocaleMiddleware,
  "/admin": [withLocaleMiddleware, withAdminMiddleware],
  "/admin/:path*": [withLocaleMiddleware, withAdminMiddleware],
  // Temporarily disabled auth middleware during Supabase migration
  "/apply/:path*": withLocaleMiddleware, // [withLocaleMiddleware, withAuthMiddleware],
  "/dev": withLocaleMiddleware,
  "/login": withLocaleMiddleware,
  "/register": withLocaleMiddleware,
  "/contact": withLocaleMiddleware,
  "/posts": withLocaleMiddleware,
  "/posts/:path*": withLocaleMiddleware,
  "/profile": withLocaleMiddleware, // [withLocaleMiddleware, withAuthMiddleware],
  "/[slug]/profile": withLocaleMiddleware, // withAuthMiddleware,
  "/onboarding/:path*": withLocaleMiddleware, // [withLocaleMiddleware, withAuthMiddleware],
  "/[slug]/onboarding/:path*": withLocaleMiddleware, // withAuthMiddleware,

  "/docs": withAdminMiddleware, // withAuthMiddleware,
  "/docs/:path*": withAdminMiddleware, // withAuthMiddleware,
};

// Create middlewares helper
export const middleware = createNEMO(middlewares);

export const config = {
  /*
   * Match all paths except for:
   * 1. /api/ routes
   * 2. /auth/ routes (Supabase authentication callbacks)
   * 3. /_next/ (Next.js internals)
   * 4. /_static (inside /public)
   * 5. /_vercel (Vercel internals)
   * 6. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
   */
  matcher: [
    "/((?!api|auth|static|.*\\..*|_next|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
