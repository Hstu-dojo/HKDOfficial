ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'EMAIL';
--> statement-breakpoint
INSERT INTO permissions (name, description, resource, action)
VALUES ('read_email', 'View all platform email history', 'EMAIL', 'READ')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.name IN ('ADMIN', 'SUPER_ADMIN') AND p.name = 'read_email'
ON CONFLICT DO NOTHING;
