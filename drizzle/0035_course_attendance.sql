ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'ATTENDANCE';
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS course_attendance_sessions (
 id text PRIMARY KEY DEFAULT gen_random_uuid(), partner_id text NOT NULL REFERENCES partners(id),
 course_id text NOT NULL REFERENCES courses(id), date date NOT NULL, label text NOT NULL,
 notes text NOT NULL DEFAULT '', records jsonb NOT NULL, recorded_by text NOT NULL,
 updated_at timestamptz(3) NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS course_attendance_session_unique ON course_attendance_sessions(course_id,date,label);
CREATE INDEX IF NOT EXISTS course_attendance_partner_date ON course_attendance_sessions(partner_id,date);
--> statement-breakpoint
INSERT INTO permissions(name,description,resource,action) VALUES
 ('read_attendance','View course attendance and reports','ATTENDANCE','READ'),
 ('update_attendance','Record and correct course attendance','ATTENDANCE','UPDATE'),
 ('manage_attendance','Manage course attendance','ATTENDANCE','MANAGE') ON CONFLICT DO NOTHING;
INSERT INTO role_permissions(role_id,permission_id) SELECT r.id,p.id FROM roles r CROSS JOIN permissions p WHERE r.name IN ('ADMIN','SUPER_ADMIN') AND p.resource='ATTENDANCE' ON CONFLICT DO NOTHING;
