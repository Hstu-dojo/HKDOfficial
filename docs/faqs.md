# Homepage FAQs

Manage FAQs at `/en/admin/faqs` (also available under `/bn` and `/ne`).

- English question and answer are required. Bangla/Nepali copies are optional; an empty translation uses the English copy. Supply both fields when translating.
- Questions are plain text; HTML is escaped. Answers preserve line breaks.
- Lower display order comes first. Only published questions appear on the homepage.
- The contact footer remains when all questions are unpublished. Hidden or deleted questions are not replaced by defaults on a successful database read.
- Saves invalidate the FAQ cache and locale homepage routes. Public reads use a five-minute cache. Default questions are used only during database errors.

## Access

The page and navigation require `ADMIN_PANEL:ACCESS` plus `FAQ:READ` or `FAQ:MANAGE`. APIs also enforce `FAQ:CREATE`, `FAQ:UPDATE`, or `FAQ:DELETE` for each write. Update controls include publication, translations and ordering. `FAQ:MANAGE` includes all FAQ actions. Custom roles can be assigned these grants through the existing RBAC editor. Partner admins are not automatically granted academy FAQ management.

Updates and deletions include the previously loaded modification time. A stale write receives HTTP 409 instead of overwriting another admin's change.

## Database

Run `pnpm db:migrate:faqs` using the deployment's `DATABASE_URL` before deploying the code. Migration `0032_faqs.sql` adds the FAQ resource and table, imports six localized starter questions, and grants FAQ management only to existing ADMIN and SUPER_ADMIN roles. It preserves custom grants. The initialization marker prevents deleted defaults from returning if the script is run again. The script commits the PostgreSQL enum addition before applying the remaining statements in a transaction.

The migration was applied to this workspace's configured database during implementation. Environments using another database need to run it as well.

Verify with `node --test tests/faqs.test.cjs` and `pnpm exec tsc --noEmit --incremental false`.
