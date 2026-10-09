# Editorial theme implementation

The academy now uses the magazine direction from the supplied references: serif feature headlines, white and neutral-gray surfaces, rounded photographic panels, a compact masthead, selective red highlights, and restrained motion.

## Changes

- Centralized light/dark colors, font roles, spacing, focus states, and publication/portal typography in `src/app/globals.css`, `src/styles/editorial.css`, and Tailwind configuration.
- Bundled Inter, PT Serif, Noto Sans Bengali, and Noto Sans Devanagari locally, with their licenses. App Router fonts also apply to portaled dialogs; Pages Router surfaces receive the same font variables.
- Rebuilt the homepage hero as a lead photographic feature with training, events, membership, and newsletter panels. Retained translated copy, existing destinations, and the newsletter submission implementation.
- Restyled academy navigation, footer, program cards, statistics, section titles, branch cards, FAQ, testimonials, and the existing Furious5 showcase.
- Applied semantic neutral surfaces and readable typography across courses, application forms, payments, gallery, committee, authentication, settings, student dashboard, central administration, and partner portal screens. Existing belt colors, provider colors, and status semantics remain distinct.
- Replaced the gallery's 3D folder presentation with photographic covers while retaining album destinations and click callbacks. Preserved lightbox, upload, and management implementations.
- Unified blog/article/notice typography and layout, scoped reading CSS, and integrated the prospectus with the same font family and red primary hue.
- Brought organization templates into the same visual family while retaining partner branding, configured content, links, schedules, and enrollment behavior.
- Added progressive section reveals, subtle image zooms, headline/image entrance motion, and reduced-motion support. Removed the large homepage parallax composition and simplified the full-page loader without imposing a routing delay.
- Corrected invalid document/description markup and the blog comment count's initial server/client URL mismatch during rendered verification.

## Scope

No API handlers, database schemas, authorization rules, CMS queries, payment calculations, form validation, upload handlers, or enrollment/download implementations were redesigned. Presentation wrappers and component markup changed. Existing routes and action destinations remain available.

## Verification

TypeScript checks and focused ESLint checks were run on the shared layouts, new theme components, fonts, hero, loading state, and album presentation. The album's native image element produces the standard Next.js optimization warning; it preserves the existing gallery's direct image rendering.

Chromium route checks exercised the homepage, course listing, login, about, contact, blog, prospectus, partner login, Bangla, and Nepali pages. Screenshots confirmed the desktop magazine composition and a 320px homepage layout. Source and route checks cover the shared portal styling; authenticated management/payment workflows require appropriate accounts and were not exercised through real mutations.

Final Chromium assertions passed for FAQ expansion, light/dark theme switching, the mobile menu, a 320px layout without page overflow, visible login form controls, and blog hydration without a mismatch. A final contrast check confirmed the partners section uses white text on an ink background. Screenshots were reviewed at desktop and mobile sizes.

The production build passed and generated all 259 static pages. The subsequent rebuild after the one-class partners background correction was stopped after prolonged filesystem stalls; that final correction was verified directly in Chromium. The completed production build predates only this background correction. Type and lint validation are disabled in the existing Next.js build configuration, so separate TypeScript and focused ESLint checks were run.

Build warnings: the existing WordPress API was unreachable and used its existing fallback; a 2.57 MB shared JavaScript chunk exceeds the PWA precache limit. Earlier external Sanity image and Google News publisher requests intermittently failed locally. Those upstream services and their integrations were retained.

## Local verification support

`NEXT_DIST_DIR` optionally selects a separate generated Next.js directory. The default remains `.next`. Generated `.next-editorial-*` directories are ignored so verification can run beside an existing development process.
