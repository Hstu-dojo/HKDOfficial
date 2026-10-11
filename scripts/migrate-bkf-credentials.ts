/** Additive schema change only; existing biographies and permissions are preserved. */
import dotenv from "dotenv";
import postgres from "postgres";
import { readFileSync } from "node:fs";
dotenv.config({ path: ".env.local", quiet: true });
dotenv.config({ path: ".env", quiet: true });
async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
  });
  try {
    await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(654321029)`;
      for (const statement of readFileSync(
        "drizzle/0029_academy_bkf_credentials.sql",
        "utf8",
      ).split("--> statement-breakpoint"))
        if (statement.trim()) await tx.unsafe(statement);
    });
    console.log(
      "Academy BKF credential fields ready; existing profiles and RBAC preserved.",
    );
  } finally {
    await sql.end();
  }
}
main().catch((error) => {
  console.error("BKF credential migration failed:", error.message);
  process.exitCode = 1;
});
