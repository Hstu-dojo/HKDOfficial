# Homepage black belt credentials

The existing homepage team profiles include optional BKF registration and black belt number fields. Each populated profile shows the identifiers and a link to the official [BKF DAN Holder List](https://bkf.gov.bd/dan-registrations-index). The page has a client-side table search, rather than individual record URLs, so the card instructs visitors to search by registration or belt number. Numbers can be selected for copying. Links open in a new tab with `noopener noreferrer`.

The following user-provided pairs were checked against the official list and applied to the four existing profiles:

| Member | BKF registration | Black belt number |
| --- | --- | --- |
| Shahriar Hasan | BKF018642 | D03135 |
| Mst. Nisha Akter | BKF018711 | D03155 |
| Nowrin Ahmed Shimonti | BKF018709 | D03157 |
| Rojnil Richil | BKF018675 | D03139 |

Rojnil's previous surname spelling was corrected in all locale entries. Other biographies, photos, display order, publication states, and permissions remain intact. The homepage links to the authoritative listing; it does not claim to perform ongoing automatic verification.

Administrators edit these identifiers in `/{locale}/admin/instructors`, under BKF black belt credentials. Existing `ADMIN_PANEL:ACCESS` and `INSTRUCTOR` action permissions protect both the page and API. Empty fields remain valid for legacy profiles and qualifications issued by other federations. The identifiers are normalized to uppercase and validated before saving.

Apply the additive schema migration with `pnpm db:migrate:bkf-credentials` when deploying against a different database. The configured database has already been migrated and updated. `scripts/update-bkf-credentials.ts` records the explicit four-member data update; it requires exactly one matching existing profile per member and updates all four atomically. It preserves other profile data.

Checks: `pnpm test:team`, `pnpm test:team:db`, and `pnpm exec tsc --noEmit`. Browser checks cover all four profiles and official links in English, Bangla and Nepali, including 320px layouts.
