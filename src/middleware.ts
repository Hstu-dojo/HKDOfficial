import { createMiddleware } from "next-easy-middlewares";
import { withLocaleMiddleware } from "./middlewares/internationalization";
import { withAuthMiddleware } from "./middlewares/authentication";

const middlewares = {
  // define your middlewares here...
  // first internationalization, then auth middleware!
  "/": withLocaleMiddleware,
  // "/services": withLocaleMiddleware,
  // "/pricing": withLocaleMiddleware,
  "/about": withLocaleMiddleware,
  "/admin": withLocaleMiddleware,
  "/admin/:path*": withLocaleMiddleware,
  "/dev": withLocaleMiddleware,
  "/login": withLocaleMiddleware,
  "/register": withLocaleMiddleware,
  "/contact": withLocaleMiddleware,
  "/posts": withLocaleMiddleware,
  "/posts/:path*": withLocaleMiddleware,
  "/profile": [withLocaleMiddleware, withAuthMiddleware],
  "/[slug]/profile": withAuthMiddleware,
  "/onboarding/:path*": [withLocaleMiddleware, withAuthMiddleware],
  "/[slug]/onboarding/:path*": withAuthMiddleware,

  "/docs": withAuthMiddleware,
  "/docs/:path*": withAuthMiddleware,
};

// Create middlewares helper
export const middleware = createMiddleware(middlewares);

export const config = {
  /*
   * Match all paths except for:
   * 1. /api/ routes
   * 2. /_next/ (Next.js internals)
   * 3. /_static (inside /public)
   * 4. /_vercel (Vercel internals)
   * 5. Static files (e.g. /favicon.ico, /sitemap.xml, /robots.txt, etc.)
   */
  matcher: [
    "/((?!api|static|.*\\..*|_next|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
