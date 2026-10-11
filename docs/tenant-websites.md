# Organization websites

Each active organization has its public homepage at `https://<slug>.p.hstuma.com/`. The main-domain `/org/<slug>` path redirects there in production; local previews can use `/org/<slug>`. Inactive or unknown organizations have no public page.

## Partner admin controls

| Portal control | Public website behavior |
| --- | --- |
| Profile | Organization name, description fallback, location, email and phone |
| Branding | Own logo and accent hue; readable light/dark theme variants |
| Hero & CTA | Hero image, tagline, announcement, establishment year and actual signup destination |
| About | About title/text and mission displayed separately |
| Founder | Instructor name, title, biography and portrait; hidden when its toggle is off |
| Features | Icons, titles and descriptions in the About section; editable without raw JSON |
| Gallery | All configured image URLs, responsive grid and keyboard-accessible photo viewer |
| Visibility | Stats, programs, schedules, gallery and instructor visibility; navigation excludes absent sections |
| Social links | HTTPS links in the footer |
| Schedules | Only active schedules for this organization's active courses, ordered by day/time; configured initial day |

Programs come from the existing course records assigned to the organization. Partner admins can edit class times through Schedules; course creation and pricing remain governed by the existing main-admin course permissions. Tenant course links lead to the academy's canonical course pages. Prices use minor currency units and remain visible only to signed-in members of that organization, consistent with the main course listing.

Tenant login and registration use the organization's saved branding. Registration offers the tenant's branch only and the signup server rejects another organization's branch. Shared academy routes, including policies and blog pages, redirect to their main-domain versions instead of broken tenant paths.

## Isolation and updates

Partner settings and profile APIs derive ownership from the authenticated partner-admin session. They never accept a client-supplied partner ID. Sessions from a different tenant hostname are rejected, including when a valid cookie is supplied. Main-domain partner portal access continues to use the session's organization. Main admin partner creation/update retains `PARTNER` RBAC and validates subdomain slugs.

Page-settings GET is read-only. PATCH validates types, colors, links and collection limits and performs an atomic upsert. Invalid submissions return 400; simultaneous first saves cannot create duplicate settings rows. Successful saves invalidate the organization's public route. Public pages use current data on each request and share identity queries only within that request.

Malformed legacy settings have safe defaults. Images stored as Next optimizer URLs are unwrapped before rendering, and unavailable images have an accessible fallback. The expired Facebook-hosted portrait for AFEAC's Sensei Loveraj Acharya was replaced with the owner-provided `/sensei.jpeg`; no other organization content was rewritten.

## Verification

- `pnpm test:tenant`: URL/settings validation, hidden sections, public components, host routing and session boundaries.
- `pnpm test:tenant:db`: disposable local PostgreSQL on port 54322; settings ownership and upsert, visibility, inactive records, scoped courses/schedules/member counts and member-only pricing. Never uses the configured production database.
- Browser checks cover AFEAC, HSTU Main Branch and Gopalganj Pilot School & College at desktop/phone sizes, navigation targets, gallery interaction and real image loading. Partner portal editing is checked without saving test content into the live database.

No new database migration is required; this uses the existing partner, page-settings and course tables.
