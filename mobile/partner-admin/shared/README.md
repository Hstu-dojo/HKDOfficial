# Shared partner portal code

The website and Expo app import these exact files. In the website use `@partner-shared/...`; in the app use `../shared/...`. Keep this folder in the repository so changes reach both consumers. Copying the mobile project into another repository makes an independent copy; it will no longer automatically share future website changes.

| Change                                                          | Edit once here  |
| --------------------------------------------------------------- | --------------- |
| Navigation groups, labels, routes and icons                     | `navigation.ts` |
| Attendance loading, selection, marking, notes, saving and retry | `controller.ts` |
| Date rules, rates, monthly summaries, CSV and attendance copy   | `attendance.ts` |
| Register input validation (also used by server API)             | `validation.ts` |
| Course, student, register and client contracts                  | `types.ts`      |
| JSON request timeout and error handling                         | `transport.ts`  |
| Shared colors, spacing, sizing and radii                        | `design.ts`     |
| Attendance metric card composition and content                  | `summary-ui.ts` |

The summary UI and attendance hook accept the platform's rendering primitives/hooks. They do not import React: Next.js uses React 18 and Expo uses React 19. This prevents a second React runtime from entering either bundle.

Platform adapters remain in `src/components/attendance/AttendanceWorkspace.tsx` (web), `mobile/partner-admin/src/AttendanceScreen.tsx` (native), and their `AttendanceSummary` components. Browser controls, Android date pickers, confirmation dialogs, cookie/bearer authentication and file sharing belong in those adapters. Shared definitions change both surfaces; adding a new platform-specific control still requires its renderer.

The other partner modules reuse the website through the authenticated WebView, so their UI and backend changes already have one implementation. Database access, Gemini, document encryption, SMTP and authorization remain server-only in the website. Never put server credentials in this folder.

Run `npm test` and `npm run typecheck` in `mobile/partner-admin`, then run `pnpm exec tsc --noEmit` and `node --test tests/attendance.test.cjs` at the repository root. The APK workflow watches `mobile/**`, including this folder.
