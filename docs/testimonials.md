# Member testimonials

Members submit one testimonial at `/{locale}/dashboard/testimonials`. The authenticated local user owns the submission; neither author identity nor approval status is accepted from the browser. Public names come from the member profile, with the username as fallback. Emails are never exposed in the homepage payload.

Every new or edited submission is pending. Admin → Testimonials supports approval, rejection with feedback, unpublishing and deletion. Review requests include the submission version; a concurrent member edit returns 409 rather than publishing content the reviewer has not seen. Members can withdraw their own testimonial. All changes invalidate the public cache.

The homepage shows up to six approved testimonials in an editorial grid. When no approved testimonials exist, three explicitly labeled design samples appear. These are not database records or endorsements from real people and disappear when an approved testimonial is available.

Run `pnpm db:migrate:testimonials` against each deployment database before deploying. The migration is additive and repeatable. It commits the new PostgreSQL enum value before inserting permissions, then creates the table and grants testimonial permissions only to ADMIN and SUPER_ADMIN. It does not approve any real testimonial or send any emails.

RBAC uses TESTIMONIAL READ, APPROVE, DELETE and MANAGE. All admin pages/APIs also require ADMIN_PANEL ACCESS. READ is required independently of APPROVE/DELETE; MANAGE covers all testimonial actions. Custom content or media roles receive no new grants automatically. Assign permissions in Admin → RBAC. Normal member submissions use authenticated ownership rather than admin privileges.

Checks: `pnpm test:testimonials` and `pnpm test:testimonials:db`. The database suite uses a disposable database on local PostgreSQL port 54322 and never uses the deployment database.
