# Paper-form quick enrollment and student documents

Partner Portal → Members → **Quick enroll from form** accepts one JPEG, PNG or WebP scan up to 3 MB. The selected vision model reads the form into the existing unified PDF-form field definitions. The administrator reviews the scan beside editable fields, adjusts the photo/applicant-signature crops visually, selects an organization-owned course, start date and admission payment state, and explicitly confirms review/consent. Unclear or missing information stays blank with warnings. Gender and medical information are never inferred from the photo. Supply a reviewed unique email; missing emails are not invented.

The active provider order is `groq,cloudflare,gemini`, configurable through server-only `ENROLLMENT_AI_PROVIDERS`:

1. Groq: `qwen/qwen3.8-27b` (`GROQ_API_KEY`, `GROQ_ENROLLMENT_MODEL`).
2. Cloudflare Workers AI: `@cf/qwen/qwen3.8-27b` (`CLOUDFLARE_AI_API_TOKEN`, `CLOUDFLARE_AI_ACCOUNT_ID`, `CLOUDFLARE_ENROLLMENT_MODEL`).
3. Gemini: `gemini-3.8-flash` (`GEMINI_API_KEY`, `GEMINI_ENROLLMENT_MODEL`).

Vercel AI Gateway has been removed from extraction and from the local/example configuration because its account rejected inference with a credit-card requirement. An old Gateway key does not activate it. Groq stays because its live extraction results were satisfactory. Gemini stays as the last fallback for when it recovers from temporary outages.

Only configured providers are attempted. Credential rejection, timeouts, network failures, rate limits, service failures and malformed output switch to the next provider. All attempts share one 45-second deadline. With the default three-provider order, a slow Groq call can consume up to 8 seconds, Cloudflare up to 30, and Gemini gets the remaining time (at least 7 seconds if the previous attempts used their full budgets). Custom orders reserve 6 seconds for each remaining provider. A sole provider can use the full deadline. Cloudflare uses `rejectIfBusy` to avoid waiting in a capacity queue; its longer timeout accommodates the measured bilingual extraction latency.

Invalid image/request responses and provider safety refusals do not switch providers. Every output uses the same form validation, crop normalization and organization-course allowlist. No successful AI result automatically creates a student: administrator review and submission remain required. If no provider succeeds, manual entry is available.

Both Qwen adapters disable thinking for OCR. Cloudflare uses its OpenAI-compatible image/chat endpoint with JSON-object output and server validation. See [Cloudflare model documentation](https://developers.cloudflare.com/workers-ai/models/qwen3.8-27b/) and [API configuration](https://developers.cloudflare.com/workers-ai/configuration/open-ai-compatibility/). Groq currently labels its supported Qwen vision model preview; its model remains configurable. See [Groq model catalog](https://console.groq.com/docs/models).

Live checks on October 12, 2026:

| Provider        | English synthetic form  | Tilted, lower-quality English/Bangla synthetic form |
| --------------- | ----------------------- | --------------------------------------------------- |
| Groq Qwen       | 7/7 checks, 1.5 seconds | 10/10 checks, 1.5 seconds                           |
| Cloudflare Qwen | 7/7 checks, 9.7 seconds | 10/10 checks, 26 seconds                            |

The bilingual checks covered English/Bangla names, birth date, email, phone, address, absent gender, organization course and absent photo/signature crops. These were single-request diagnostics on printed synthetic images, not a real-handwriting benchmark. No real student records, drafts or emails were created. All provider credentials are server-only; configure the Cloudflare credentials/model and provider order in Vercel before deployment. The existing R2 settings are separate and unchanged.

## Submission

- `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_SUPABASE_URL` provision a new confirmed Supabase account. A cryptographically generated temporary password is emailed and shown once to the submitting admin. No plaintext password is stored in Postgres, extraction data or email history.
- Existing email accounts are rejected with a clear instruction to use the existing member's Direct Enroll flow. The importer never changes an existing account's credentials, roles, branch or username.
- The database transaction saves the member/profile, approved academy registration, full course application, original scan/document records, and an active course enrollment when appropriate. Enrollment retains all unified form fields and original paper registration number; generated platform IDs remain unique.
- Admission fees are read from the selected course. Unpaid admission creates a `pending_payment` application without claiming payment, enrolling or generating monthly fees. Explicit offline-collected admission (or a free-admission course) produces an approved application and active enrollment; shared billing logic generates initial monthly fees. Active course row locking protects quick-enrollment capacity checks.
- SMTP uses the project's existing `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` / `EMAIL_FROM_ADDRESS` configuration and shared email layout. Delivery is recorded in centralized platform/organization email history. Mail failure does not roll back a successfully created student; the result reports failure and shows the one-time temporary password. The existing member-management password-reset action can recover access later. Newsletter synchronization remains best effort.
- Draft ownership and status claim prevent duplicate/concurrent submissions. Replaying a completed draft returns its stored member reference without creating another account or sending another password email. Validation failures keep the draft editable. Database failure compensates the new Supabase account and new R2 objects; a failed compensation is marked `failed` for manual recovery. Interrupted `processing` drafts must be reconciled by an operator against Supabase before retrying; they are deliberately not automatically replayed. Drafts expire for submission after seven days. Closing an unsubmitted dialog deletes its draft and attempts file cleanup. Abandoned tabs/browser crashes may leave drafts requiring periodic operator cleanup; there is no added cron job.

## Private files and record access

The original upload is retained byte-for-byte, alongside separately generated normalized extraction previews during drafting. Final original/photo/signature files are organized as:

`students/<organization-name>--<organization-id>/<student-name>--<profile-id>/<category>/<document-uuid>.<extension>`

Stable organization/profile IDs distinguish identical names; document UUIDs distinguish repeat uploads. Document database rows make searches independent of renamed display names. Every original, preview and cropped document is AES-256-GCM encrypted before R2 upload. The permission-checked server decrypts it for authorized viewers; public R2 responses contain authenticated ciphertext rather than personal documents. Keep `STUDENT_DOCUMENTS_ENCRYPTION_KEY` (64 hex characters) server-only, backed up and unchanged. Losing/replacing it makes existing documents unreadable. A dedicated private bucket remains recommended. Set `CLOUDFLARE_R2_STUDENT_BUCKET_NAME` to a private student-document bucket; if omitted the existing `CLOUDFLARE_R2_BUCKET_NAME` is reused. Existing Cloudflare R2 account/endpoint/access credentials are shared. No public R2 URL is created or returned; raw objects are encrypted application/octet-stream data. Requests proxy file bytes through `/api/student-documents/<id>/file` after authentication/ownership checks and use private no-store responses. PDF downloads use attachment disposition and all files use nosniff headers. Upload categories include registration forms, photos, signatures, birth certificates, identity, medical and other documents. Each upload is limited to 3 MB; images are decoded/validated, SVG/HTML are rejected, and optional replacement photo/signature updates the member profile.

**Record & docs** beside each Partner Portal member exposes member details, saved enrollment forms, categorized scans and document upload. Partner admins can access only their current organization's members and document/application records. Students can retrieve their own attached document files. **Admin → Student Records** searches across organizations by name, email or member number, with pagination, organization filtering and the same record/document viewer.

Main-admin access requires `ADMIN_PANEL:ACCESS` and `MEMBER:READ`; document upload additionally requires `MEMBER:UPDATE` (MANAGE covers actions). Media-only access does not grant student-document access. Partner portal sessions are scoped to their authenticated organization using the existing tenant/custom-host checks. New schemas are `quick_enrollment_drafts` and `student_documents`; run `pnpm db:migrate:student-documents` on each database before deployment. The additive migration was applied to the locally configured database during implementation; it creates no student accounts or document records.

## Verification and deployment

New applications use seven-digit references such as `2601158`: year `26`, organization `01`, and that organization's annual serial `158`. Organization codes are permanent (`00` is the academy; partners use `01`–`99`), and serials run from `001` to `999` independently per organization/year using an atomic database counter. Deleting an application does not release its number. Existing references are preserved; counters continue beyond historical applications. Run `pnpm db:migrate:application-numbers` before deploying the new code. The database keeps the full UUID as its internal ID.

For admission fees collected later, the partner's Enrollments page offers **Record payment** on pending applications. Cash may use an optional receipt; bKash and bank transfers require a reference. After verifying receipt of the full admission fee, use **Enroll student**. Application and course locks keep approval atomic and prevent duplicate enrollment; monthly billing runs after the enrollment transaction commits.

Course selection is prefilled from active, enrollment-open courses belonging to the authenticated organization. Gemini receives only that scoped course list and may match a written course name; missing or invalid suggestions fall back to the first available course (ordered by name). The preview keeps the course and its fees editable before submission. The submit API still checks course ownership and enrollment availability. When no course is available, create or reopen a course first.

Paper forms without gender show “Not recorded on paper” and can be submitted. Missing gender is stored as null, with no guess from a photo or name. Explicitly written gender is extracted and remains editable. This requires no database migration: the profile column and enrollment JSON already support missing information.

- `node --test tests/quick-enrollment.test.cjs tests/rbac-access.test.cjs` validates review schema, unique folders, ownership, replay, account protection, paid/pending handling, rollback compensation, email failure and read/write boundaries.
- Browser tests exercised scan preview, editing, crop rendering, explicit review, one submit, result and student record at 1440px and 390px, using mocked API responses. No page errors or horizontal overflow.
- A live Postgres transaction verified new foreign keys and scoped document queries, then rolled back all fixture rows.
- TypeScript check: `pnpm exec tsc --noEmit`.

`GEMINI_API_KEY` and the pinned model are set in the local `.env.local` and must also be set in Vercel. SMTP/R2 credentials are configured locally. `SUPABASE_SERVICE_ROLE_KEY` is **not** configured locally, so real account creation cannot run until that server-only key is added. No live student accounts or credential emails were created during testing. Existing R2 object write/read/delete and SMTP authentication were verified. Creating a dedicated private bucket was rejected by Cloudflare (`AccessDenied`), so no bucket was created or existing public settings changed. The existing bucket is supported using server-side encrypted objects. A separate encryption key is configured locally; copy it unchanged to Vercel along with the Gemini configuration. A private bucket can be selected later when credentials permit it.

Official references: [Gemini image understanding](https://ai.google.dev/gemini-api/docs/image-understanding), [Gemini models](https://ai.google.dev/gemini-api/docs/models), [Cloudflare R2 AWS SDK](https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/).
