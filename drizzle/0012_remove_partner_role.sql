-- Remove the PARTNER role from the RBAC system
-- Partner organizations are managed via Payload CMS with separate auth,
-- so a PARTNER role in the main RBAC system is not needed.

-- Delete role_permissions entries for the PARTNER role
DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE name = 'PARTNER');

-- Delete user_roles entries for the PARTNER role
DELETE FROM user_roles
WHERE role_id IN (SELECT id FROM roles WHERE name = 'PARTNER');

-- Delete the PARTNER role itself
DELETE FROM roles WHERE name = 'PARTNER';
