# Organization custom domains

Admin → Partners → Organization Domains lists eligible domains already attached to this Vercel project. Select an organization beside a verified production hostname and click Assign. Apex (`dojo.com`) and `www.dojo.com` are independent exact-host assignments. Wildcard hosts and the academy's own root/website/deployment hosts cannot be assigned. Existing `<slug>.p.hstuma.com` routing stays available.

Use Vercel's project domain settings for DNS, certificates, domain ownership verification and redirects. A host that redirects at Vercel, belongs to a preview branch/custom environment, or is unverified cannot be assigned. Adding a hostname to Vercel does not automatically associate it with an organization. Refresh the dialog after updating Vercel. The tool also retains explicit subdomain creation under `TENANT_BASE_DOMAIN`.

The first assigned hostname is the organization's canonical URL, including page metadata, structured data, sitemap and portal public-page link. Additional assigned hostnames serve the same organization. To change the canonical hostname, unassign older mappings. Unassigning removes only the application's mapping, never the Vercel project domain or DNS. A host cannot belong to two organizations; reassignment requires explicit unassignment first. Deactivated organizations do not resolve through custom hosts.

The stored mapping connects public pages, branding, authentication-page branch selection, partner login/session isolation, signup branch selection, public partner list and canonical email callback destinations. Existing organization content and portal financial permissions are unchanged. Supabase email callbacks continue using the configured academy callback host, then resolve the stored tenant destination; no custom-domain wildcard redirect is trusted.

## Configuration

- `VERCEL_PROJECT_ID`: project ID or project name.
- `VERCEL_API_TOKEN`: server-only access token allowed to read project domains; adding legacy tenant subdomains also needs domain write access.
- `VERCEL_TEAM_ID`: optional owner team ID for team-scoped API tokens/projects.
- `ROOT_DOMAIN`: academy root, default `hstuma.com`.
- `TENANT_BASE_DOMAIN`: tenant suffix, default `p.hstuma.com`.
- `SITE_URL` / `NEXT_PUBLIC_APP_URL`: academy canonical URL, which is protected from assignment.
- `TENANT_LOOKUP_ORIGIN`: optional **trusted** academy origin; defaults to `https://www.<ROOT_DOMAIN>`. For local custom-host testing set `http://localhost:3000`. Middleware performs a bounded lookup against this fixed origin, never against the untrusted incoming Host.

The Edge middleware calls `/api/tenant-domain` for custom host resolution. That public endpoint returns only an active organization's public slug. Unknown hosts return 404; routing lookup failures return 503, rather than displaying another organization's or academy page. Requests use no-store so assignment/removal take effect on subsequent requests. Server-rendered pages and APIs independently resolve the database mapping rather than trusting caller-provided tenant headers.

## Storage and access

Run `pnpm db:migrate:partner-domains` against each target database before deploying. The additive, idempotent migration creates `partner_domains`; it does not seed domain assignments, mutate existing organizations or change Vercel. It has already been applied to the database configured locally during this implementation. Migration `0033_partner_domains` is also registered in the Drizzle migration journal.

RBAC requires `ADMIN_PANEL:ACCESS` plus `PARTNER:READ` to list, `PARTNER:UPDATE` to assign/unassign, and `PARTNER:CREATE` to add a legacy subdomain (MANAGE covers actions). Partner admins cannot manage host assignments.

Checks: `node --test tests/partner-domains.test.cjs tests/tenant-site.test.cjs tests/rbac-access.test.cjs`, plus `pnpm exec tsc --noEmit`. Local Vercel credentials are not configured, so live Vercel listing/DNS verification could not be exercised. No custom hostname was assigned during development.
