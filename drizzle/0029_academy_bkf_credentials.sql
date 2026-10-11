ALTER TABLE academy_people ADD COLUMN IF NOT EXISTS bkf_registration_no text NOT NULL DEFAULT '';
--> statement-breakpoint
ALTER TABLE academy_people ADD COLUMN IF NOT EXISTS black_belt_no text NOT NULL DEFAULT '';
