# Homepage sensei and academy team

Edit profiles at `/en/admin/instructors` (Admin → Sensei & Team). Profiles are stored in `academy_people`; the public homepage receives only published profiles and public fields.

The featured sensei appears first, followed by instructors and black-belt members. Only one sensei may be published at a time. Each profile supports a portrait URL, display order, name, title, rank, short description, and English, Bangla, and Nepali copy. The sensei also has a biography and optional HTTPS profile link. Missing translated fields fall back to English. New profiles start as drafts.

Use a local public asset such as `/sensei.jpeg`, or upload a portrait through Gallery and paste its public HTTPS URL. Profile editing does not grant media-upload permissions.

## Access

Both the admin page and API enforce permissions. Every API operation requires `ADMIN_PANEL:ACCESS` and its corresponding `INSTRUCTOR` permission (`READ`, `CREATE`, `UPDATE`, or `DELETE`). The sidebar follows the read permission; write controls follow their individual permissions. `MANAGE` follows the existing RBAC rules. The additive migration grants this resource to ADMIN and SUPER_ADMIN only; custom roles can be configured through the existing RBAC dashboard.

## Initial content

Loveraj Acharya's name, **3rd Dan — Nepal Karate Federation**, Facebook link, and `public/sensei.jpeg` were supplied by the site owner. The short biography references his instructor role and the 2025–2026 committee announcement on the [dojo's official LinkedIn page](https://www.linkedin.com/company/hstu-dojo). Expand the biography with approved content through the editor.

Shahriar Hasan's black-belt membership comes from the academy's existing active member record. Nowrin Ahmed Shimonti, Mst. Nisha Akter, and Rojnil Ritchil were confirmed as black belts by the site owner. These profiles contain only a short membership description; portraits and individual biographies can be added later.

## Setup and verification

Run `pnpm db:migrate:team` against the target database before deploying this feature. This migration is additive and safe to rerun; it does not overwrite profiles or custom role grants. The configured database has already been migrated and the initial published profiles added.

Run `pnpm test:team` for component, validation, and API permission tests, and `pnpm test:rbac-access` for admin route authorization. `pnpm test:team:db` uses a disposable local PostgreSQL database on port 54322 and checks migration idempotence and actual CRUD behavior; it never uses the production database URL.

Published profiles are cached for five minutes. Admin changes invalidate the team cache and localized homepage immediately. Direct database edits become visible after cache revalidation.
