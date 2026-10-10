import { config } from "dotenv";
import { readFile } from "node:fs/promises";
import postgres from "postgres";

// Apply only the additive competition-results migration, without running unrelated pending migrations.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const client = postgres(process.env.DATABASE_URL, {
    prepare: false,
    max: 1,
    connect_timeout: 10,
  });
  try {
    const migration = await readFile(
      new URL("../drizzle/0024_flowery_redwing.sql", import.meta.url),
      "utf8",
    );
    await client.begin(async (transaction) => {
      for (const statement of migration.split("--> statement-breakpoint")) {
        if (statement.trim()) await transaction.unsafe(statement);
      }
    });
    console.log(
      "Competition results table, indexes, and constraints are ready. Existing EVENT permissions are used; role assignments were not changed.",
    );
  } finally {
    await client.end();
  }
}

main().catch(() => {
  console.error(
    "Competition results setup failed. Check database connectivity and migration privileges.",
  );
  process.exitCode = 1;
});
