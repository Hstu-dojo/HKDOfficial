# Partner onboarding & partner assignment flow

This doc describes how partner assignment is derived and how it affects pricing and access.

## Partner assignment sources (canonical order)

For a given user, partner assignment is resolved as:

1. **Member/Profile** (`profiles.partnerId` / `members.partnerId`) — if the user already has a created profile.
2. **Onboarding registration** (`registrations.partnerId`) — for users who have submitted onboarding but are still `pending` (pending counts as onboarded for access).
3. **Fallback**: legacy rows may have `partnerId` only inside `registrations.notes` JSON. New code tries to backfill the column where possible.

Shared resolution helpers live in `src/lib/partner-assignment.ts`.

## Course pricing visibility

Business rule:

- Before onboarding (no partner assignment): users can browse courses but **prices are hidden**.
- After onboarding (partner assignment exists): users can see prices **only for courses owned by their partner**.

Pricing redaction is applied in both:

- Public APIs: `src/app/api/courses/*`
- Public pages: `src/app/(with-theme)/*/karate/courses/*` and `src/app/(with-theme)/*/partner/[slug]`

## Partner portal: creating members + auth provisioning

Partners can add new members via:

- `POST /api/partner-portal/members`

The endpoint now treats account provisioning as a full onboarding flow. Partner admins must provide:

- `email`
- `password`
- core onboarding details such as name, phone, sex, date of birth, agreement, and the rest of the profile data collected during registration

`userName` and `userAvatar` can still be omitted; the backend will generate sensible defaults when needed.

If the email is new, the endpoint will:

1. Create a Supabase Auth user using the partner admin-entered password as the temporary initial password (service role key required)
2. Insert a local `user` row linked by `supabaseUserId`
3. Create the member/profile record under the partner
4. Send a Supabase password reset email so the user can set their own password

If the email already exists in the local user table, the endpoint links the profile to that user and still triggers the reset-password flow.

The password entered by the partner admin is now treated as the temporary initial password. It is not emailed back in plaintext.

> **Note on Direct Approval:** By design, members added via `POST /api/partner-portal/members` bypass the "pending registration" flow (`registrations` row). Since the partner admin is directly creating them, they are assumed to be immediately approved and jump straight to having an active member profile.

### Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

For emailing credentials:

- `RESEND_API_KEY`
- Optional: `EMAIL_FROM_ADDRESS`
- Optional: `NEXT_PUBLIC_APP_URL` (used to generate the login link)
