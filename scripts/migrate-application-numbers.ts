import dotenv from "dotenv";
import postgres from "postgres";
import { readFileSync } from "node:fs";
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });
async function main() {
  if (!process.env.DATABASE_URL) throw Error("DATABASE_URL required");
  const client = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
  try {
    await client.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(654321036)`;
      for (const statement of readFileSync(
        "drizzle/0036_application_numbers.sql",
        "utf8",
      ).split("--> statement-breakpoint"))
        if (statement.trim()) await tx.unsafe(statement);
    });
    console.log("Year/organization application numbering ready.");
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error("Application numbering migration failed");
  process.exitCode = 1;
});
