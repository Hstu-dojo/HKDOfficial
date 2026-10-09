# Kaizen Karate Academy — editorial UI redesign plan

Status: implemented theme direction. See `UI-REDESIGN-IMPLEMENTATION.md` for changes and verification notes.

## 1. Objective and boundaries

Give the entire academy platform one recognizable visual identity: a contemporary karate publication with strong photography, confident typography, deliberate spacing, and clear information hierarchy.

Scope includes public academy pages, courses and programs, applications, organization pages, gallery, blog and notices, authentication, student dashboard, administration, partner portal, settings, prospectus, and supporting loading/error/empty states.

Preserve routes, navigation destinations, authentication, authorization, data fetching, CMS queries and preview behavior, field names, validation, submission handlers, upload behavior, payment instructions, calculations, downloads, pagination, search, and existing user workflows. Presentation components may be extracted, but existing behavior stays attached. Preserve current content, translations, partner configuration, and real statistics. Do not invent awards, instructor credentials, dates, or enrollment promises.

## 2. Project context and findings

The repository is Kaizen Karate Academy, despite the directory name `hkdofficial`.

| Area | Existing implementation | Redesign implication |
| --- | --- | --- |
| Framework | Next.js 15, React 18, TypeScript; App Router plus Pages Router | Both router trees need visual coverage. |
| Shared UI | Tailwind 3, Radix/shadcn-style components, CSS variables | Extend the existing component foundation. |
| Academy site | `src/app/(with-theme)/[locale]`; Roboto; system light/dark theme | Centralize typography and semantic colors while preserving theme preference. |
| Content | Sanity blog/notices, CMS previews; legacy WordPress/template surfaces | Restyle rendering without changing content sources. |
| Organization pages | `src/app/(org)`; separate black/red brutalist styles; Bebas Neue and JetBrains Mono | Bring organization templates into the academy design family while preserving partner identity. |
| Portals | Student dashboard, central admin, separate partner-admin shell | Share tokens and control styling; use compact operational layouts. |
| Localization | English, Bangla, Nepali locale files | Fonts, line heights, text wrapping, and labels must support all existing languages. |
| Media | Local karate photos/logos, Cloudinary gallery, Sanity images | Reuse authentic media; check resolution and crop before selection. |
| Learning/reference | Nextra prospectus/docs through Pages Router | Preserve sidebar/search/navigation and improve reading typography. |
| Platform | PWA and offline page; multiple loaders, toasts, error pages | Include secondary states and check cached styling during verification. |

### Why the current theme feels fragmented

- `src/app/globals.css` defines teal primary, purple secondary, red accent, and blue/slate dark surfaces.
- `src/styles/org-globals.css` defines a separate monochrome/red theme with square corners and its own animations.
- The main localized layout uses Roboto. The Sanity layout defines PT Serif, Inter, and IBM Plex Mono. Organization pages define another font pair. Partner portal typography is not established through the same localized layout.
- The blog forces light mode and hardcodes white/black surfaces; the academy and partner portal use system theme. Preserve these existing preferences initially and supply a coherent light palette everywhere plus matching dark tokens where dark mode already exists.
- Many pages bypass tokens through hardcoded gray/slate/blue colors, gradients, rounded cards, and independent section spacing. Changing primary color alone will leave substantial inconsistency.
- Public header/footer instances are assembled in individual pages. Blog and organization pages have their own navigation implementations. They need shared visual conventions without losing context-specific links.
- Homepage mixes parallax, card grids, verification, news, FAQ, testimonial sliders, Furious5, partner logos, and CTA sections. It needs a common visual rhythm.
- Blog CSS includes unscoped paragraph/list rules. Organization CSS repeats Tailwind layers. Check style ownership and cross-route effects before consolidating.
- The themed wrapper enforces a 350px minimum width and horizontal scrolling; blog layout uses `w-screen`. Address layout overflow as presentation work.

These findings come from source review. A rendered screenshot audit remains the first implementation step; exact spacing, image quality, and live-data states have not yet been visually verified.

## 3. Proposed art direction: The Dojo Journal

The user-provided magazine references guide this direction: elegant serif headlines, a centered masthead, white and soft-gray surfaces, tightly composed asymmetric panels, compact metadata, restrained red highlights, and generous article reading space. The academy identity comes through real karate photography and existing content.

The public site should feel like a contemporary sports and culture magazine. Use a white publication canvas on a pale-gray outer background, softly rounded feature panels, fine rules, occasional black utility strips, and selective headline highlights. At small widths, let the publication canvas fill the viewport and stack panels in a meaningful reading order. The angled tablet imagery in the references is presentation mockup framing, not a layout or animation to reproduce on the actual website.

Use the existing academy mark. Let photography and typography carry the brand. Avoid adding decorative Japanese characters, fabricated heritage, excessive grain, competing gradients, glowing backgrounds, or heavy shadows. Existing informational and interactive sections remain; their visual treatments become quieter and more cohesive.

### Color tokens

| Role | Proposed light value | Use |
| --- | --- | --- |
| Outer canvas | `#EFEFEF` | Desktop page surround |
| Paper | `#FFFFFF` | Main publication background |
| Soft panel | `#F5F5F4` | Feature cards and grouped information |
| Surface | `#FFFFFF` | Inputs, menus, dialog surfaces |
| Ink | `#191919` | Headlines and body text |
| Muted ink | `#626262` | Supporting copy and metadata |
| Rule | `#DADADA` | Decorative separators and card boundaries |
| Vermilion | `#C62828` | Select headline highlights, primary actions, active markers |
| Dark paper | `#171716` | Dark-mode background and feature panels |
| Dark surface | `#222220` | Dark-mode elevated surfaces |
| Light ink | `#F5F2EB` | Text on dark surfaces |

Convert final values into the HSL token format already used by Tailwind. Separate brand accent, hover surface, focus ring, and destructive action tokens. Success, warning, information, and actual belt colors remain semantic exceptions, paired with text labels. Form boundaries may need stronger contrast than decorative rules. Verify contrast rather than assuming these proposed colors satisfy every use.

### Typography

- Display: an elegant regular-weight serif for public headlines and article titles, with an expressive but readable shape matching the references. Evaluate existing PT Serif in the first visual slice; if its proportions feel too heavy, choose one suitable replacement serif. Avoid condensed athletic uppercase as the main heading style.
- Reading/interface: Inter, already present in the blog, for navigation, body text, forms, dashboard labels, and tables.
- Editorial emphasis: use the same serif for short introductions, pull quotes, and selected reading copy; Inter remains the interface font. Use weight, italic, and scale for variety rather than adding several decorative families.
- Bangla/Nepali: choose script-capable companions, such as Noto Sans Bengali and Noto Sans Devanagari, after checking availability and representative text. Use native-script display treatment rather than forcing Latin uppercase or tight tracking.
- Proposed desktop lead-story scale: 48–72px using fluid sizing; mobile: 34–44px. Section headlines: 28–44px; body: 16–18px; metadata: 12–14px. Long-form text: about 18px with 1.65–1.8 line height. Match the reference hierarchy while keeping website text legible; do not reproduce its tiny screenshot text sizes.
- Reading width: 65–75 characters. Use tabular numerals for fees, dates, counts, and tables. Cap display width and allow long titles to wrap.

### Layout, components, and motion

- Public maximum width around 1280px, a 12-column desktop grid, 24–32px gutters, and 16–20px mobile padding.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 64, 96px. Public sections use about 64–96px vertical spacing; portal sections about 24–40px.
- Use asymmetric image/text compositions and ruled rows alongside a small set of grids. Shared alignment matters more than identical section layouts.
- Publication shell: about 20–24px corners on desktop. Feature panels: 12–16px corners with restrained 4–8px gaps in the magazine cluster; regular sections retain larger gutters. Image corners follow their panel. Form controls use 6–8px corners; outlined masthead actions may be pill-shaped. Avatars remain circular.
- Primary button: solid vermilion, clear label, optional arrow. Secondary: ink outline. Text action: underline or arrow. Preserve disabled, pending, destructive, and focus states.
- One icon style for newly restyled visible controls, preferably existing Lucide. Replace icons incrementally only where presentation benefits; keep behavior intact.
- Apply the coordinated animation specification below. Preserve slider/carousel controls, honor reduced motion, and keep content visible without animation.

### Animation specification

| Element | Motion | Timing |
| --- | --- | --- |
| Initial masthead and lead feature | Fade in with an 8–16px upward settle; headline animates as a whole block | 450–650ms; 60–90ms stagger |
| Editorial sections | One-time small upward reveal as the section enters the viewport | 400–550ms |
| Feature photography | Short clipped reveal within a fixed-size frame; no layout shift | 600–800ms |
| Image-card hover | Image scales to about 1.025; arrow shifts 3–4px | 250–350ms |
| Text links and outlined actions | Underline grows or surface color changes; retain a clear focus state | 180–220ms |
| Sticky masthead | Background/border transition; fixed reserved height | 180–250ms |
| Existing menu, modal, and drawer | Small fade/translation using current component lifecycle | 180–240ms |
| Existing accordion | Smooth height transition through current accessible primitive | 200–250ms |

Use one shared easing curve such as `cubic-bezier(0.22, 1, 0.36, 1)` and the existing animation tooling. Prefer transform and opacity; only use clipping on a few feature images. The first hero must render immediately, with animation as progressive enhancement. Cap entrance sequencing so the initial content is visible promptly. Do not place whole pages behind animation timers.

Animate text blocks rather than splitting every letter, especially for Bangla and Nepali. Do not introduce scroll hijacking, cursor-following effects, continuous card movement, or new page-navigation behavior. Reuse existing carousel interaction. On touch devices omit hover-only movement; for reduced motion show content immediately and suppress transforms/clipped reveals.

### Translating the references into academy content

- Lead magazine panel: a real academy training photograph, current hero headline, short introduction, and existing destinations. A selected phrase may use a red background with accessible light text. Keep the subject and text legible; choose overlay or split placement based on the actual image.
- Supporting panels: current programs, branch information, news, and gallery content, sized by hierarchy. Preserve current content and actions while expressing a lead/support relationship visually.
- Compact tiles: current statistics, partner information, and useful academy links. The financial widgets, subscription controls, audio player, and article metrics in the reference are visual examples, not features to add.
- Article/detail page: generous serif headline, readable text column, quieter metadata rail where data exists, existing actions, and a large photo beneath. On mobile move metadata into document flow.
- Portals: borrow the soft neutral panels, fine borders, compact metadata, and motion restraint; keep sans-serif table/form typography.

## 4. Page-by-page redesign

### Global public shell

Restyle header as a compact editorial masthead: academy mark/wordmark centered on wide screens where navigation space allows, balanced navigation and account/language/theme controls, and the existing contact action. On mobile prioritize the mark and accessible menu without forcing desktop symmetry. Compact the sticky state without abrupt height changes or content overlap. Keep every current navigation destination and onboarding alert. Use one header-height convention instead of page-specific guesses.

Footer becomes a ruled directory with academy branding, existing links/contact information, and any current social or newsletter features. Blog and partner headers can have context labels and CMS/partner links while sharing spacing, typography, rules, and action treatments.

### Homepage

Default first pass preserves the existing section order and every section's content/actions. Proposed visual treatment in that order:

1. Hero: a magazine-style lead panel with an elegant serif headline, softly rounded neutral image framing, and complementary compact panels using existing hero content/media where appropriate. Preserve existing gallery links and hero information; choose a lead image from the existing data without changing fetching.
2. Programs: editorial cards/rows with consistent images, labels, and current destinations.
3. Statistics: slim ruled strip using current data and labels.
4. Branches: directory-style grid with location, identity, and existing branch information.
5. Why us: split composition with numbered principles and existing copy.
6. Recent albums: photographic contact-sheet styling with existing album links and counts.
7. Certificate verification: concise utility panel keeping the full existing workflow.
8. Featured posts: one visually prominent story and complementary items where current data permits; consistent metadata.
9. FAQ: clean ruled accordion with current questions and interaction.
10. Testimonials: large quote treatment and quieter current slider controls.
11. Furious5: bring the existing showcase into the same typography, imagery, and spacing system.
12. Partners: orderly logo strip/grid, preserving logos and links.
13. Final CTA: strong closing panel with existing actions.

Preserve chat access and ensure floating controls do not cover buttons on mobile. Reordering is optional later; it is unnecessary to achieve the initial UI objective.

### Academy information

- About: feature-style introduction, photo/story composition, ruled statistics, instructor portrait cards, existing CTA.
- Contact: editorial title and two-column contact/form composition; preserve all form validation and map behavior. Use intentional map framing rather than styling the entire content through inversion.
- Committee: consistent profile/list treatment and restyled application form; retain selection and membership behavior.
- Branch/partner directories: shared directory cards with partner logos, locations, and current counts/actions.
- Developer, services, pricing, search, and legacy template pages: inherit the system; retain existing copy, routes, and controls even when content is less central to the academy.

### Courses, programs, and applications

- Listings: page title, current controls, consistent feature cards/rows, schedule/fee/audience metadata, labeled enrollment states. Actual belt colors remain recognizable.
- Course detail: editorial image/title, readable description, structured schedule/features, and prominent existing fee/application panel. On mobile place actions in the natural document flow; do not hide details.
- Program detail: event-style presentation emphasizing existing date, venue, fee, eligibility, and registration status. Keep upload/payment registration modal behavior.
- Course application wizard: calmer step indicator, grouped fields, consistent uploads and errors; preserve step order, saved state, validation, calculations, and submission.
- Application success: restrained confirmation with the existing application reference and PDF download actions.

### Gallery and moments

- Albums: consistent covers, title/date/count hierarchy, controlled image ratios, simple borders.
- Album detail: photo-led layout and clear navigation; preserve previews, image interactions, management access, and downloads.
- Pages Router `moments` and photo route: extend palette/control typography without breaking the existing shared modal and next/previous behavior.
- Gallery management: use portal density and existing controls, preserving the current special full-width layout.

### Blog, articles, and notices

Build on `WallMagazine`, existing story components, and Sanity rendering rather than introducing a separate magazine subsystem. Shared visual masthead, lead story composition, ruled secondary stories, consistent article metadata, and a readable article column create the editorial identity.

Restyle portable text headings, lists, blockquotes, images/captions, links, author panels, and existing sharing/comments. Preserve CMS menus, queries, slug resolution, feeds, SEO, draft previews, and Sanity data attributes. Keep the existing light-only blog behavior in the initial pass. Scope article CSS to article containers so list spacing does not affect menus or portals.

### Organization pages

Replace the independent brutalist palette/typography treatment with academy tokens and editorial grid conventions. Keep partner logos, images, announcements, configurable links, schedules, programs, gallery, stats, and enrollment dialogs. Partner identity appears through its existing content and imagery; the surrounding UI belongs to the same academy family. Preserve custom-domain/tenant behavior.

### Authentication and settings

Use a consistent reading/form layout with academy imagery or a restrained ink panel where the existing split layout permits. Restyle login, register, password recovery/reset/setup, verification, OAuth errors, intercepted login modal, and partner login. Preserve OAuth actions, callbacks, password visibility, field logic, errors, and loading states.

Settings retain their current navigation and forms with common page headers, labels, control sizes, and separators.

### Student, admin, and partner portals

Use the same paper/ink/red palette, interface font, separators, button/input styles, and status conventions. Keep large expressive display type on public features; portal headings stay compact.

- Standardize sidebar density, active marker, header height, avatars, and mobile drawer presentation while retaining separate role-specific navigation.
- Student: restyle profile completion, enrollments, payment forms, certificates, committee card, and app download page.
- Admin: cover dashboard, users/roles/permissions, partners, courses, programs/types/registrations, applications, billing/monthly fees/payment settings, committees, certificates/signatures, gallery, and docs surfaces.
- Partner: cover dashboard, members, pending students, enrollments, branch requests, schedules, bills, monthly billing/status, profile, page settings, and admin management.
- Tables: quiet headers, visible rows/dividers, tabular numbers, consistent filters/pagination and current action menus. Retain meaningful columns and selection states. Use local horizontal scrolling on small screens rather than removing data.
- Dialogs/forms: standard titles, field spacing, validation, action order, and pending states without changing handlers.

### Prospectus, documentation, and system states

Theme Nextra through supported configuration and scoped overrides, preserving its sidebar, search, contents, and learning content. Give the prospectus a readable handbook treatment related to the editorial brand. Avoid applying academy CSS inside embedded Swagger or Sanity Studio internals; style surrounding owned UI where appropriate.

Restyle offline, unauthorized, not-found, error, loading, skeleton, toast, empty, and no-data states. PDF templates, certificate content, and email rendering are separate output contracts; preserve them in this website UI pass. Any visible email preview gets a themed surrounding shell without altering the email itself.

## 5. Implementation architecture

1. Establish shared semantic tokens and font roles. Reuse existing background, foreground, card, primary, border, input, ring, and sidebar variables; add success/warning/info and editorial roles where needed.
2. Separate common token definitions from route-specific presentation. Ensure all relevant App/Pages Router surfaces receive tokens without importing competing Tailwind base layers everywhere.
3. Normalize button, input, textarea, select, badge, card, tabs, accordion, dialog, sheet, toast, and sidebar styling through `src/components/ui`.
4. Add a small set of presentation primitives, such as page container, editorial page heading, section heading/rule, story card, metadata row, and portal page heading. Add a reusable table treatment only if existing tables can adopt it without changing behavior.
5. Migrate hardcoded brand/surface styles component by component. Do not globally remap every blue/red/green utility: some encode belt ranks, payment providers, or status semantics.
6. Keep public, reading, and portal layout variants. Consistency is shared tokens and hierarchy, not forcing every page into one layout.
7. Keep providers, authorization checks, server/client boundaries, suspense boundaries, and data contracts intact while updating wrappers and presentation.

### Principal edit targets

| Layer | Targets |
| --- | --- |
| Foundation | `src/app/globals.css`, `tailwind.config.js`, `src/styles/index.css`, `src/styles/org-globals.css` |
| Font/layout ownership | `src/app/(with-theme)/layout.tsx`, localized layout, Sanity layout/blog layout, organization layout, partner-portal layout, `src/pages/_app.tsx`, Nextra configuration |
| Public shell | `src/components/layout/*`, `src/components/maxWidthWrapper.tsx`, blog navbar/footer, organization navigation/footer |
| Homepage | `src/components/sections/*`, hero presentation, Furious5, shared editorial primitives |
| Enrollment | `src/components/karate/*`, student payment/enrollment components, localized course/program pages |
| Content | `src/components/blogs/*`, blog CSS, gallery/committee/org components, `src/pages/moments.tsx`, photo route |
| Portals | `src/components/dashboard/*`, `src/components/admin/*`, partner portal shell/nav/client screens |
| States | loading components, route loading/error/not-found files, offline/unauthorized pages, toast styling |

## 6. Delivery sequence and reviewable outputs

### Phase 0 — rendered baseline and route checklist

Record screenshots of representative public, blog, org, auth, student, admin, partner, and prospectus pages. Inventory repeated sections and component variants, current routes, all action destinations, and visible UI states. Review existing logos and candidate photo resolution/crops. Use available authorized accounts or fixtures for protected pages without changing permissions or production data.

Output: visual baseline, route checklist, and media shortlist. Missing credentials/data are recorded as verification limits, not grounds to skip designing those surfaces.

### Phase 1 — foundation and representative design slice

Implement tokens, font roles, container/grid rules, controls, and a representative public shell/homepage composition. Include one course card, article sample, form, and portal table sample to prove the design works beyond marketing.

Output: concrete reviewable design slice in light/dark contexts where supported and mobile/desktop widths. Establish the direction before repeating it across the platform.

### Phase 2 — public academy pages

Complete homepage sections, about/contact/committee, directories, course/program listings/details, application/success, verification, gallery, and supporting public pages.

Output: public academy routes consistently themed with all existing actions retained.

### Phase 3 — editorial and organization surfaces

Unify blog/notices/article styling, Sanity preview renderers, org/partner pages, and Pages Router photography surfaces. Finish prospectus/docs typography using scoped integration.

Output: navigating between academy, publication, branches, and learning pages feels like one brand.

### Phase 4 — accounts and portals

Restyle auth/settings, student dashboard, central administration, partner portal, shared management forms/tables/dialogs, and related states.

Output: complete operational coverage with unchanged workflows and compact readable layouts.

### Phase 5 — consistency and regression verification

Audit leftover legacy styles, route transitions, image loading, keyboard interaction, locale text, and PWA cached assets. Remove unused presentation styles only after confirming usage. Fix defects introduced by the redesign, documenting unrelated baseline issues separately.

Output: route/state review checklist, before/after samples, verification results, and any access/data limits.

## 7. Acceptance criteria and validation

- All owned route families use the same palette, font roles, spacing logic, rules, and component states; no unexplained teal/purple branding or independent brutalist skin remains.
- Every existing action, form field, route destination, permission rule, data operation, upload, payment instruction, and download is preserved.
- Representative widths: 320, 375, 768, 1024, and 1440px. No page-wide horizontal scrolling; dense tables may scroll in their own containers.
- Existing English, Bangla, and Nepali content stays readable, with no clipped native-script glyphs or forced Latin display styling.
- Light/dark coverage follows the existing supported theme behavior; check logo contrast, input states, menus, popovers, dialogs, tables, and status badges.
- Keyboard navigation, visible focus, dialog focus/close behavior, accessible names, labels/errors, and reduced motion continue to work. Aim for WCAG AA text contrast and sufficiently visible control boundaries.
- Smoke-check login/register/reset, course application/success/PDF download, program registration/payment proof upload, certificate verification/download, gallery interactions, fee payment, admin dialogs, and partner edits using safe data or mocks where mutations would affect real records.
- Compare route screenshots and inspect representative empty/loading/error/long-title/no-image states. Check client-side navigation between style systems, not only direct page loads.
- Run appropriate static checks and production build. The current `lint` script uses `next lint`; verify the installed tooling before choosing the lint command. Production config ignores TypeScript/build lint errors, so a passing build alone is insufficient: compare explicit checks against the baseline.
- Do not add database tests for a UI-only migration. Add focused interaction tests only when presentation restructuring creates a meaningful behavioral regression risk.
- Preserve image sizing/lazy loading and existing server rendering/caching; avoid adding client animation dependencies or shipping unnecessary font variants. Check offline/PWA refresh behavior after asset changes.

## 8. Decisions and assumptions

Confirmed reference direction: white and soft-gray publication surfaces, ink, selective red highlights, elegant serif feature headlines, readable multilingual body text, authentic karate photography, softly rounded magazine panels, fine borders, editorial asymmetry, and coordinated subtle animation.

This is a proposal, not a claim that these are existing official brand colors. Keep current logo artwork and media sources. Preserve blog light-only behavior, site theme controls, routes, translations, content, homepage section order, and portal workflows in the first implementation pass. The initial rendered design slice can refine the palette/type balance without requiring structural or functional changes.
