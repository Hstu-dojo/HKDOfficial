ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'TESTIMONIAL';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS testimonials (
 id text PRIMARY KEY DEFAULT gen_random_uuid(), user_id text NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
 display_name text NOT NULL, affiliation text NOT NULL DEFAULT '', comment text NOT NULL, rating integer NOT NULL,
 status text NOT NULL DEFAULT 'pending', review_note text NOT NULL DEFAULT '', reviewed_by text REFERENCES "user"(id) ON DELETE SET NULL,
 reviewed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT testimonial_rating CHECK(rating BETWEEN 1 AND 5),
 CONSTRAINT testimonial_comment CHECK(char_length(comment) BETWEEN 20 AND 1200),
 CONSTRAINT testimonial_status CHECK(status IN ('pending','approved','rejected'))
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS testimonial_status_idx ON testimonials(status,reviewed_at);
--> statement-breakpoint
INSERT INTO permissions(name,description,resource,action) VALUES
 ('read_testimonial','Read submitted testimonials','TESTIMONIAL','READ'),
 ('approve_testimonial','Approve, reject or unpublish testimonials','TESTIMONIAL','APPROVE'),
 ('delete_testimonial','Delete testimonials','TESTIMONIAL','DELETE'),
 ('manage_testimonial','Manage testimonials','TESTIMONIAL','MANAGE') ON CONFLICT DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('ADMIN','SUPER_ADMIN') AND p.resource='TESTIMONIAL' ON CONFLICT DO NOTHING;
