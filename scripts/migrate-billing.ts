/** Applies only the additive billing migration, for databases previously managed with db:push. */
import dotenv from "dotenv";
import postgres from "postgres";
import { readFileSync } from "node:fs";
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 1,
    connect_timeout: 10,
  });
  try {
    await client.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(654321025)`;
      const [duplicates] =
        await tx`SELECT COUNT(*)::int AS groups FROM (SELECT enrollment_id,billing_month FROM monthly_fees GROUP BY enrollment_id,billing_month HAVING COUNT(*)>1) d`;
      if (duplicates.groups)
        throw new Error(
          `Found ${duplicates.groups} duplicate billing periods. Review and reconcile these records before adding uniqueness; no financial records were changed.`,
        );
      const statements = readFileSync(
        "drizzle/0025_billing_integrity.sql",
        "utf8",
      ).split("--> statement-breakpoint");
      for (const statement of statements)
        if (statement.trim()) await tx.unsafe(statement);
    });
    console.log("Billing migration applied. Financial records were preserved.");
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error("Billing migration failed:", error.message);
  process.exitCode = 1;
});
