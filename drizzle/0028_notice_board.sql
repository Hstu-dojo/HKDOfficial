ALTER TABLE notices ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general';
--> statement-breakpoint
ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE notices ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;
--> statement-breakpoint
ALTER TABLE notices ADD COLUMN IF NOT EXISTS translations jsonb NOT NULL DEFAULT '{}'::jsonb;
--> statement-breakpoint
ALTER TABLE notices ADD COLUMN IF NOT EXISTS attachment_url text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS notices_publication_idx ON notices(is_published,is_archived,published_at DESC);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS notice_feeds (key text PRIMARY KEY, items jsonb NOT NULL, fetched_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
INSERT INTO permissions(name,description,resource,action) VALUES
 ('create_announcement','Create academy notices','ANNOUNCEMENT','CREATE'),
 ('read_announcement','View academy notice management','ANNOUNCEMENT','READ'),
 ('update_announcement','Edit and publish academy notices','ANNOUNCEMENT','UPDATE'),
 ('delete_announcement','Delete academy notices','ANNOUNCEMENT','DELETE'),
 ('manage_announcement','Manage academy notices','ANNOUNCEMENT','MANAGE') ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('ADMIN','SUPER_ADMIN') AND p.resource='ANNOUNCEMENT' ON CONFLICT DO NOTHING;
