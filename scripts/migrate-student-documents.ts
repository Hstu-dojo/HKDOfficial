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
      await tx`SELECT pg_advisory_xact_lock(654321034)`;
      for (const statement of readFileSync(
        "drizzle/0034_student_documents.sql",
        "utf8",
      ).split("--> statement-breakpoint"))
        if (statement.trim()) await tx.unsafe(statement);
    });
    console.log("Student document and quick enrollment tables ready.");
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error("Student document migration failed.");
  process.exitCode = 1;
});
