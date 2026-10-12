CREATE TABLE IF NOT EXISTS quick_enrollment_drafts (
 id text PRIMARY KEY, partner_id text NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
 admin_id text NOT NULL REFERENCES partner_admins(id) ON DELETE CASCADE,
 status text NOT NULL DEFAULT 'draft', extracted jsonb, profile_id text REFERENCES profiles(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS student_documents (
 id text PRIMARY KEY, partner_id text NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
 profile_id text REFERENCES profiles(id) ON DELETE CASCADE, draft_id text REFERENCES quick_enrollment_drafts(id) ON DELETE CASCADE,
 kind text NOT NULL, filename text NOT NULL, mime_type text NOT NULL, size integer NOT NULL,
 bucket text NOT NULL, object_key text NOT NULL UNIQUE, uploaded_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS student_documents_profile_idx ON student_documents(profile_id);
CREATE INDEX IF NOT EXISTS student_documents_draft_idx ON student_documents(draft_id);

--> statement-breakpoint
ALTER TABLE quick_enrollment_drafts ADD COLUMN IF NOT EXISTS submission_email text;
ALTER TABLE quick_enrollment_drafts ADD COLUMN IF NOT EXISTS provisioned_auth_id text;
