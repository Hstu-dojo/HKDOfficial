CREATE TABLE IF NOT EXISTS "oauth2_authorization_codes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" text NOT NULL,
	"client_id" text NOT NULL,
	"redirect_uri" text NOT NULL,
	"scope" text DEFAULT '' NOT NULL,
	"user_id" text NOT NULL,
	"code_challenge" text NOT NULL,
	"code_challenge_method" text DEFAULT 'S256' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth2_refresh_tokens" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" text NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"token_hash" text NOT NULL,
	"issued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"rotated_to_id" text,
	"last_used_at" timestamp with time zone,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "oauth2_token_invalidations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"client_id" text NOT NULL,
	"invalidated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "oauth2_auth_code_hash_idx" ON "oauth2_authorization_codes" USING btree ("code_hash");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "oauth2_refresh_token_hash_idx" ON "oauth2_refresh_tokens" USING btree ("client_id","token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "oauth2_refresh_token_family_idx" ON "oauth2_refresh_tokens" USING btree ("family_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "oauth2_token_invalidations_user_client_idx" ON "oauth2_token_invalidations" USING btree ("user_id","client_id");