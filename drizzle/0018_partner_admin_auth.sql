CREATE TABLE IF NOT EXISTS "partner_admins" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "partner_id" text NOT NULL REFERENCES "partners"("id") ON DELETE CASCADE,
  "email" text NOT NULL,
  "password_hash" text NOT NULL,
  "name" text NOT NULL,
  "phone" text,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = current_schema()
      AND indexname = 'partner_admins_email_unique'
  ) THEN
    CREATE UNIQUE INDEX "partner_admins_email_unique" ON "partner_admins" ("email");
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "partner_admins_partner_id_idx" ON "partner_admins" ("partner_id");

CREATE TABLE IF NOT EXISTS "partner_admin_sessions" (
  "token" text PRIMARY KEY,
  "partner_admin_id" text NOT NULL REFERENCES "partner_admins"("id") ON DELETE CASCADE,
  "expires_at" timestamptz NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "partner_admin_sessions_partner_admin_id_idx" ON "partner_admin_sessions" ("partner_admin_id");
CREATE INDEX IF NOT EXISTS "partner_admin_sessions_expires_at_idx" ON "partner_admin_sessions" ("expires_at");
