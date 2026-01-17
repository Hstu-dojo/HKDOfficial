CREATE TABLE IF NOT EXISTS "gallery_folders" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"parent_id" text,
	"cloudinary_folder" text NOT NULL,
	"cover_image_id" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_folders_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "gallery_images" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folder_id" text,
	"public_id" text NOT NULL,
	"asset_id" text,
	"secure_url" text NOT NULL,
	"format" text,
	"resource_type" text DEFAULT 'image',
	"width" integer,
	"height" integer,
	"bytes" integer,
	"title" text,
	"description" text,
	"alt_text" text,
	"tags" jsonb DEFAULT '[]'::jsonb,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_published" boolean DEFAULT true NOT NULL,
	"uploaded_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gallery_images_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_folders" ADD CONSTRAINT "gallery_folders_parent_id_gallery_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."gallery_folders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_folders" ADD CONSTRAINT "gallery_folders_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_folders" ADD CONSTRAINT "gallery_folders_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_folder_id_gallery_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."gallery_folders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "gallery_images" ADD CONSTRAINT "gallery_images_uploaded_by_user_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
