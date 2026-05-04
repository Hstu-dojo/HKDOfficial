ALTER TABLE "committees" ADD COLUMN "trainer_signature_id" text;--> statement-breakpoint
ALTER TABLE "committees" ADD COLUMN "coordinator_signature_id" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "committees" ADD CONSTRAINT "committees_trainer_signature_id_certificate_signatures_id_fk" FOREIGN KEY ("trainer_signature_id") REFERENCES "public"."certificate_signatures"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "committees" ADD CONSTRAINT "committees_coordinator_signature_id_certificate_signatures_id_fk" FOREIGN KEY ("coordinator_signature_id") REFERENCES "public"."certificate_signatures"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
