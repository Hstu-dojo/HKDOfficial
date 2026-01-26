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
  
  // Admin routes - require admin-level roles (both with and without locale prefix)
  "/admin": [withLocaleMiddleware, withAdminMiddleware],
  "/admin/:path*": [withLocaleMiddleware, withAdminMiddleware],
  "/:locale/admin": [withAdminMiddleware],
  "/:locale/admin/:path*": [withAdminMiddleware],
  
  // Dashboard routes - require authentication
  "/dashboard": [withLocaleMiddleware, withAuthMiddleware],
  "/dashboard/:path*": [withLocaleMiddleware, withAuthMiddleware],
  "/:locale/dashboard": [withAuthMiddleware],
  "/:locale/dashboard/:path*": [withAuthMiddleware],
  
  // Karate routes - public
  "/karate/courses": withLocaleMiddleware,
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
  "/posts/:path*": withLocaleMiddleware,
  
  // Public routes with locale prefix (for client-side navigation)
  "/:locale/login": withLocaleMiddleware,
  "/:locale/register": withLocaleMiddleware,
  "/:locale/contact": withLocaleMiddleware,
  "/:locale/dev": withLocaleMiddleware,
  "/:locale/posts": withLocaleMiddleware,
  "/:locale/posts/:path*": withLocaleMiddleware,

  // Docs routes - require admin-level roles
  "/docs": [withAdminMiddleware],
  "/docs/:path*": [withAdminMiddleware],
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
