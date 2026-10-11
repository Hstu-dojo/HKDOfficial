/** Additive and idempotent; preserves historical email/billing records and custom role grants. */
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
    // New enum value must commit before PostgreSQL permits using it in the grants.
    const statements = readFileSync(
      "drizzle/0027_academy_team.sql",
      "utf8",
    ).split("--> statement-breakpoint");
    await client.unsafe(statements[0]);
    await client.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(654321027)`;
      for (const statement of statements.slice(1))
        if (statement.trim()) await tx.unsafe(statement);
    });
    console.log(
      "Academy team table and permissions ready; ADMIN and SUPER_ADMIN granted management access.",
    );
  } finally {
    await client.end();
  }
}
main().catch((error) => {
  console.error("Academy team migration failed:", error.message);
  process.exitCode = 1;
});
