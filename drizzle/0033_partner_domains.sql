CREATE TABLE IF NOT EXISTS "partner_domains" (
  "domain" text PRIMARY KEY,
  "partner_id" text NOT NULL REFERENCES "partners"("id") ON DELETE CASCADE,
  "created_by" text REFERENCES "user"("id") ON DELETE SET NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "partner_domain_lowercase" CHECK (domain = lower(domain))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "partner_domains_partner_idx" ON "partner_domains"("partner_id");
