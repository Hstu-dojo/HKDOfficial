ALTER TABLE "user" ADD COLUMN "has_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "auth_providers" jsonb;