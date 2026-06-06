ALTER TYPE "belt_rank" ADD VALUE 'purple';--> statement-breakpoint
ALTER TABLE "payment_accounts" ADD COLUMN "partner_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
