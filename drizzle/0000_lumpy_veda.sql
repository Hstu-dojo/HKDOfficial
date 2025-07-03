DO $$ BEGIN
 CREATE TYPE "public"."identity_type" AS ENUM('NID', 'BIRTH_CERTIFICATE', 'PASSPORT', 'DRIVING_LICENSE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."provider_type" AS ENUM('Google', 'GitHub');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."roletype" AS ENUM('ADMIN', 'MODERATOR', 'INSTRUCTOR', 'MEMBER', 'GUEST');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "account" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"name_bangla" text NOT NULL,
	"father_name" text NOT NULL,
	"image" text NOT NULL,
	"avatar" text,
	"bio" text,
	"sex" text NOT NULL,
	"dob" timestamp with time zone NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"country" text NOT NULL,
	"postal_code" text NOT NULL,
	"age" integer NOT NULL,
	"blood_group" text NOT NULL,
	"height" real NOT NULL,
	"weight" real NOT NULL,
	"occupation" text NOT NULL,
	"identity_type" "identity_type" NOT NULL,
	"identity_number" text NOT NULL,
	"identity_image" text,
	"institute" text NOT NULL,
	"faculty" text,
	"department" text,
	"session" text,
	"signature_image" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "email-log" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payload" json
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "permission-group" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"level_name" text NOT NULL,
	"features" text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "provider" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" "provider_type" NOT NULL,
	"provider_account_id" text,
	"profile" json,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "session_session_token_unique" UNIQUE("session_token"),
	CONSTRAINT "session_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	"password" text NOT NULL,
	"user_name" text NOT NULL,
	"user_avatar" text NOT NULL,
	"default_role" "roletype" DEFAULT 'GUEST' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_user_name_unique" UNIQUE("user_name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user-role" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"role" "roletype" DEFAULT 'GUEST' NOT NULL,
	"level_id" text,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user-role_level_id_unique" UNIQUE("level_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification-token" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"uid" text NOT NULL,
	"token" text NOT NULL,
	"validity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "provider" ADD CONSTRAINT "provider_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user-role" ADD CONSTRAINT "user-role_level_id_permission-group_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."permission-group"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user-role" ADD CONSTRAINT "user-role_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification-token" ADD CONSTRAINT "verification-token_uid_user_id_fk" FOREIGN KEY ("uid") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
