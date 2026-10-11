CREATE TABLE IF NOT EXISTS newsletter_subscribers (
 id text PRIMARY KEY DEFAULT gen_random_uuid(), email text NOT NULL UNIQUE, name text NOT NULL DEFAULT '',
 source text NOT NULL, status text NOT NULL DEFAULT 'pending', provider_id text, error text,
 next_attempt_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT newsletter_email_lowercase CHECK (email = lower(email)),
 CONSTRAINT newsletter_subscriber_status CHECK (status IN ('unverified','pending','synced','unsubscribed'))
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS newsletter_broadcasts (
 id text PRIMARY KEY DEFAULT gen_random_uuid(), source_key text NOT NULL UNIQUE, notice_id text,
 subject text NOT NULL, body text NOT NULL, format text NOT NULL DEFAULT 'markdown', attachments jsonb NOT NULL DEFAULT '[]',
 status text NOT NULL DEFAULT 'draft', provider_id text, segment_id text, error text, created_by text,
 due_at timestamptz NOT NULL DEFAULT now(), sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT newsletter_broadcast_status CHECK (status IN ('draft','queued','creating','sending','sent','failed','unknown','canceled')),
 CONSTRAINT newsletter_broadcast_format CHECK (format IN ('markdown','html'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS newsletter_broadcast_queue_idx ON newsletter_broadcasts(status,due_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS newsletter_attachments (id text PRIMARY KEY, name text NOT NULL, key text NOT NULL UNIQUE, type text NOT NULL, bytes integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS newsletter_webhook_events (id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
INSERT INTO permissions(name,description,resource,action) VALUES
 ('create_email','Create newsletter drafts and upload attachments','EMAIL','CREATE'),
 ('update_email','Edit newsletter drafts','EMAIL','UPDATE'),
 ('approve_email','Send newsletter broadcasts and process pending sends','EMAIL','APPROVE') ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('ADMIN','SUPER_ADMIN') AND p.resource='EMAIL' ON CONFLICT DO NOTHING;
