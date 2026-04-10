DO $$
BEGIN
  ALTER TYPE "belt_rank" ADD VALUE 'brown_kyu3';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  ALTER TYPE "belt_rank" ADD VALUE 'brown_kyu2';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$
BEGIN
  ALTER TYPE "belt_rank" ADD VALUE 'brown_kyu1';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
