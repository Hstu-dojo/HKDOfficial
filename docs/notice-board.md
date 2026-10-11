# Notice board

The homepage and `/notice` share one notice board with two clearly labeled sources. `/notice/:id` renders academy notices; federation notices open the original BKF application/document. Existing notices are preserved. No sample announcements are published automatically.

## Academy management

Use `/{locale}/admin/announcements` (Notice board in the admin sidebar). Create drafts, publish immediately or schedule a publication date, set an expiry, pin important notices, add HTTPS/local-file attachments, and supply optional Bangla/Nepali translations. Dates in the editor use Bangladesh time. Missing translations fall back to English per field. Notice bodies support Markdown; raw HTML and embedded images are disabled.

Only published, non-archived notices whose publication date has arrived appear publicly. Expired notices leave the homepage and move into Past notices; their public links remain available. Archiving or unpublishing hides the public detail page as well. Use Archive to keep an internal record, or Delete to remove it permanently.

The admin page and every API method independently require `ADMIN_PANEL:ACCESS` plus `ANNOUNCEMENT:READ/CREATE/UPDATE/DELETE` respectively. `ANNOUNCEMENT:MANAGE` covers those actions under the existing permission resolver. Assign granular permissions to custom content roles through existing role management. The additive migration grants the existing ADMIN and SUPER_ADMIN roles announcement permissions while preserving other grants. Author IDs come from the authenticated session, never the request body.

## BKF ISR and resilience

Source: https://bkf.gov.bd/all-notice

A server-only parser reads the official Notice / Published Date table. Each item retains its own identity even when several entries share an application link. Only links on `bkf.gov.bd` are accepted; missing/unsafe links fall back to the source listing. BKF titles stay as published; the board controls and dates support all three locales.

The Next.js Data Cache (`unstable_cache`) revalidates this feed every 1,800 seconds. This provides ISR-style background refresh even on the dynamically rendered, localized homepage. It requires no cron job. Academy data revalidates every 60 seconds and is invalidated immediately on admin writes. Scheduling is checked on each read; expiry is evaluated when rendering the board.

A successful BKF fetch also writes a `notice_feeds` snapshot. A failed refresh throws so the cache retains the last successful entry; if a cache entry is unavailable, the persisted snapshot is used and labeled as a previous update. If neither exists, only the federation panel displays an unavailable state. Fetches have an eight-second timeout and reject oversized responses or an empty/unrecognized table rather than replacing good data. External notices are read-only and cannot be edited through academy CRUD.

## Setup and validation

Run `pnpm db:migrate:notices` against the target environment before deploying the code. It is additive and idempotent; it does not need `db:push`. No new environment variables are required. The project-configured database has been migrated during implementation; deployments using a different database need the same migration.

- `pnpm test:notices`: parsing, publication/date rules, validation, permissions, and snapshot fallback.
- `pnpm test:rbac-access`: existing route permission checks.
- `pnpm test:notices:db`: disposable PostgreSQL integration checks; expects the same local test database setup used by the other integration suites, defaults to port 54322.
- `pnpm exec tsc --noEmit`: project type checking.

Design follows the existing editorial section headings, purple/aqua palette and shared dashboard controls. Native links/buttons, labeled search and category controls, mobile wrapping, and visible source labels make the two sources easy to distinguish. The public sitemap lists actual academy notice IDs rather than unrelated blog posts.

Research references: [BKF source](https://bkf.gov.bd/all-notice), [Next.js caching](https://nextjs.org/docs/app/api-reference/functions/unstable_cache), and [Next.js authorization guidance](https://nextjs.org/docs/app/guides/authentication).
