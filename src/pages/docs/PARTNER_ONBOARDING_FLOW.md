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

## Partner portal: creating members + optional auth provisioning

Partners can add new members via:

- `POST /api/partner-portal/members`

If `email` is provided and there is no existing local user with that email, the endpoint will:

1. Create a Supabase Auth user with a **random password** (service role key required)
2. Insert a local `user` row linked by `supabaseUserId`
3. Create the member/profile record under the partner
4. Best-effort email the credentials via Resend

### Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

For emailing credentials:

- `RESEND_API_KEY`
- Optional: `EMAIL_FROM_ADDRESS`
- Optional: `NEXT_PUBLIC_APP_URL` (used to generate the login link)
