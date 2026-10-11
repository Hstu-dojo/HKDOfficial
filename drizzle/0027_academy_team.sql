ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'INSTRUCTOR';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS academy_people (
 id text PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK(kind IN ('sensei','instructor','black_belt')),
 translations jsonb NOT NULL,
 photo_url text NOT NULL DEFAULT '',
 display_order integer NOT NULL DEFAULT 0,
 is_published boolean NOT NULL DEFAULT false,
 created_by text REFERENCES "user"(id) ON DELETE SET NULL,
 updated_by text REFERENCES "user"(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE academy_people ADD COLUMN IF NOT EXISTS profile_url text NOT NULL DEFAULT '';
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS academy_people_published_sensei_idx ON academy_people(kind) WHERE kind='sensei' AND is_published=true;
--> statement-breakpoint
INSERT INTO permissions(name,description,resource,action)
VALUES ('create_instructor','Create academy team biographies','INSTRUCTOR','CREATE'),
 ('read_instructor','View academy team biographies','INSTRUCTOR','READ'),
 ('update_instructor','Edit academy team biographies','INSTRUCTOR','UPDATE'),
 ('delete_instructor','Delete academy team biographies','INSTRUCTOR','DELETE'),
 ('manage_instructor','Manage academy team biographies','INSTRUCTOR','MANAGE')
ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions(role_id,permission_id)
SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('ADMIN','SUPER_ADMIN') AND p.resource='INSTRUCTOR'
ON CONFLICT DO NOTHING;
