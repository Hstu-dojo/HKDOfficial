# Admin access enforcement

Admin access requires `ADMIN_PANEL:ACCESS` (or `ADMIN_PANEL:MANAGE`) plus the
permission for the requested page. Role names do not bypass the permission
matrix. `src/lib/rbac/admin-route-access.ts` is the shared page policy used by
Edge middleware, server page guards, and navigation. Unknown admin sections are
denied. Direct URLs, locale-prefixed URLs, and server-rendered page data use the
same policy. Restricted users visiting the admin root are redirected to a page
they can access instead of receiving cross-resource dashboard statistics.

A gallery administrator needs panel access and `GALLERY:READ`. Uploads require
`GALLERY:CREATE`; edits and deletions require their corresponding permissions.
`GALLERY:MANAGE` covers all gallery actions. Those permissions do not grant
access to users, payments, certificates, programs, or role management.

Role assignment/removal APIs require `ROLE:UPDATE` or `ROLE:MANAGE`, including
legacy endpoints. `USER:UPDATE` allows profile edits, but cannot assign a role
or change `defaultRole`. User updates whitelist supported fields and cannot
change the Supabase identity mapping through arbitrary JSON fields.

Admin program, registration, certificate, template, and committee server actions
check resource/action permissions independently of the page. Certificate PDF
access is limited to a certificate reader or the owner of an issued certificate.
Private gallery API reads require gallery read permission; published public
requests remain available. The credentials-email helper is server-only, rather
than a directly callable server action.

Explicit role assignments, including inactive assignments, override legacy
`defaultRole` access. Removing an assignment marks it inactive. Inactive/missing
roles and database failures deny access. Committee roles require approved
membership in an active committee; committee activation and role-bearing
approval also require role-update permission. Deleting a committee revokes its
role assignments transactionally. Permission responses are not browser cached.

No schema migration, permission grants, or changes to existing role assignments
are performed by this patch. Deploy the application changes for enforcement.

## Regression checks

```sh
pnpm test:rbac-access
pnpm exec tsc --noEmit
```

The tests execute the actual guards and handlers with isolated authentication and
storage, including a media-only administrator, a profile editor, role managers,
anonymous callers, revoked roles, and database failure. They do not mutate the
configured database.
