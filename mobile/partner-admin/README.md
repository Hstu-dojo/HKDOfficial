# Kaizen Partner Admin — Expo Android app

This is an independent React Native application, with its own package manifest, npm lockfile, TypeScript configuration and Android build configuration. It can be copied into a separate repository without importing any website source. It uses the existing academy backend.

Native screens: secure sign-in, branch home, student search/details, and course attendance. Attendance includes a date picker, course selector, multiple named sessions, large present/absent/late/excused buttons, mark-all-present, per-student/session notes, search, corrections, monthly history/student summaries and CSV sharing. Unsaved changes prompt before leaving. Network failures retain edits for retry; there is no background/offline sync.

The complete existing partner portal opens in an authenticated in-app WebView for enrollment, paper-form scanning/cropping and document uploads, billing/reminders, student activity, branch transfers, schedules, email history, organization profile, website settings and admin management. These screens reuse the current portal UI and remain controlled by its server-side organization permissions. This is a hybrid app; these modules have not been individually rewritten as native screens.

## Shared website/app implementation

Attendance state, validation, API transport, navigation, design values and summary-card UI are shared with the website in [`shared/`](shared/README.md). Edit those definitions once to update both clients. The native and browser controls remain platform adapters. The remaining portal modules already reuse the website UI through the WebView.

## Run the app

```sh
cd mobile/partner-admin
npm ci
npm start
```

Install Expo Go compatible with SDK 57 or use `npm run android` with a connected Android device. The standalone APK does not require Expo Go or Metro. The default backend is configured in `app.json` at `expo.extra.apiOrigin`, currently `https://www.hstuma.com`. Change that config value to change the default; no `.env` setup is required. Administrators can also enter their tenant/custom HTTPS website origin at sign-in. Debug development builds allow HTTP local origins, while release builds require HTTPS.

No database, Gemini, SMTP, Supabase service-role, or Cloudflare secrets belong in this app. No passwords or user credentials are bundled. The app sends the user's entered credentials to the existing partner login API. The random 24-hour session token is kept in Expo SecureStore and sent as an Authorization bearer header. Every API still checks the active admin, active branch, expiration and host/tenant binding. Logout revokes the session when online and always clears device storage. No student register is persistently cached; exported CSV is temporarily stored in the app cache for the Android share sheet.

## Website backend prerequisite

Deploy the matching website changes before using this APK against production:

- `POST /api/partner-admin/login` with `client: "mobile"` returns a session token and expiry after the same credential checks.
- `GET /api/partner-admin/session` validates the stored token.
- Shared partner authentication now accepts the same session via an Authorization header in addition to browser cookies.
- `GET /api/partner-admin/mobile-session` exchanges a valid bearer session for an HttpOnly portal cookie and redirects only within `/partner-admin`. Tokens are not passed in URLs or injected into page JavaScript.
- `POST /api/partner-admin/logout` revokes either native or browser sessions.
- The course-attendance API and migration from the preceding implementation must also be deployed/applied.

No additional database migration or role bypass is needed for mobile authentication. Main-admin RBAC and organization isolation remain enforced by the existing server.

## Build a standalone APK locally

Prerequisites: Node supported by Expo SDK 57, Java 17, Android SDK platform/build-tools 36, an accepted Android SDK license and enough disk space for Gradle dependencies.

```sh
export JAVA_HOME=/path/to/jdk-17
export ANDROID_HOME=/path/to/Android/Sdk
npm run apk
```

The script generates native Android files with Expo prebuild and runs `:app:assembleRelease`. The result is `artifacts/kaizen-partner-admin-preview.apk`. It embeds the JavaScript bundle, targets ARM64 phones, and uses the generated **debug signing key for internal preview**. It must not be used as a store production signing identity. Keep your real production keystore outside source control.

For a properly signed internal APK through EAS:

```sh
npx eas-cli build --platform android --profile preview
```

EAS setup/login and project signing credentials are required for cloud distribution. The `production` profile generates a Play Store Android App Bundle.

## Automatic APK builds with GitHub Actions

The repository workflow `.github/workflows/partner-admin-apk.yml` builds this app directly on a GitHub-hosted Android runner. It runs for mobile changes pushed to `main`, matching pull requests, or manually under **Actions → Partner Admin APK → Run workflow**. It installs Node 24, Java 17 and the Android SDK, caches npm/Gradle dependencies, checks types/tests/Expo versions, builds a bundled ARM64 preview APK, verifies its signature and uploads the APK plus SHA-256 checksum. No Expo account, Expo token or application secrets are required for this preview build.

After a successful run, open its summary and download `kaizen-partner-admin-apk-<run number>` from **Artifacts**, then unzip it to obtain the installable APK. Artifacts are retained for 30 days. The build uses the same generated debug signing key as the local internal-preview build; it does not publish to Google Play or GitHub Releases.

Both GitHub workflows read and validate `expo.extra.apiOrigin` directly from the committed `app.json`. No Actions variable, secret or manual URL input is needed. Use only an HTTPS origin, with no page path. Administrators can still choose their own tenant origin on the app's sign-in screen. The backend authentication changes need deployment independently of building the APK.

This app folder also contains its own `.github/workflows/partner-admin-apk.yml` configured for a standalone repository root. If you copy this folder into a separate repository, that workflow works without changing paths. In the current website repository, GitHub uses the root workflow; the nested workflow is only used when this app becomes its own repository.

## Checks

```sh
npm run typecheck
npm test
npx expo install --check
```

The root website's `tests/partner-mobile.test.cjs` covers token parsing, the constrained cookie handoff and session authorization. Android build output is ignored; Expo source/configuration are authoritative. Root Next.js TypeScript checks exclude this independent React Native codebase.

References: [Expo APK builds](https://docs.expo.dev/build-reference/apk/), [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/), [WebView](https://docs.expo.dev/versions/latest/sdk/webview/).
