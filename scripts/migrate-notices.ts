/** Additive notice-board upgrade; preserves existing notices and custom RBAC grants. */
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
      await tx`SELECT pg_advisory_xact_lock(654321028)`;
      for (const statement of readFileSync(
        "drizzle/0028_notice_board.sql",
        "utf8",
      ).split("--> statement-breakpoint"))
        if (statement.trim()) await tx.unsafe(statement);
    });
    console.log(
      "Notice board schema and ANNOUNCEMENT permissions ready; existing notices and custom grants preserved.",
    );
  } finally {
    await sql.end();
  }
}
main().catch((error) => {
  console.error("Notice migration failed:", error.message);
  process.exitCode = 1;
});
