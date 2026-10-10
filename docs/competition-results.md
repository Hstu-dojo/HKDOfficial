# Competition results

Open `/{locale}/admin/competition-results` or choose **Competition Results** in the admin sidebar.

Select an existing academy member, enter the competition name, date, category/division, and placement. Results start as private drafts. Check **Publish on homepage** to include the result in the public record. Edit and save to correct a finish or unpublish it. Deleting a result requires confirmation.

The homepage groups published results by year. Placements 1, 2, and 3 count as gold, silver, and bronze respectively. Rankings compare gold first, then silver, then bronze. Identical medal counts share a rank. Other placements appear in the full results record. Categories should include the discipline and division, such as `Kumite · Senior -60kg`, to distinguish an athlete's entries at the same competition.

No demonstration results are seeded. Academy members' names are displayed publicly only when their results are published. Private profile fields are not returned to the homepage.

## Permissions

Existing RBAC permissions control both the page and its API:

| Operation | Permission |
| --- | --- |
| View results and member selector | `EVENT:READ` |
| Add a result | `EVENT:CREATE` |
| Edit or publish/unpublish an existing result | `EVENT:UPDATE` |
| Delete a result | `EVENT:DELETE` |
| All operations | `EVENT:MANAGE` |

Assign these through the existing RBAC permission matrix. The setup does not change role assignments. API checks use the authenticated Supabase session and local user's permissions, independently of visible UI controls.

## Database setup

Migration `drizzle/0024_flowery_redwing.sql` adds only the competition-results table, foreign keys, indexes, and placement constraint. The configured development database has been set up. For another environment, run:

```sh
pnpm exec tsx scripts/setup-competition-results.ts
```

This idempotent setup reads `DATABASE_URL` from the environment or `.env.local` and applies only this additive migration. The migration is also included in the normal Drizzle migration history. Duplicate entries for the same member, competition, date, and category are rejected.

Successful saves and deletions invalidate locale homepage caches. The homepage also retains its existing 60-second revalidation interval; viewers see refreshed results on subsequent page loads.
