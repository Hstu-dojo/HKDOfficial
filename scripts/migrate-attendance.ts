import dotenv from "dotenv";
import postgres from "postgres";
import { readFileSync } from "node:fs";
dotenv.config({ path: ".env.local", quiet: true });
async function main() {
  const client = postgres(process.env.DATABASE_URL!, {
    max: 1,
    prepare: false,
  });
  try {
    const statements = readFileSync(
      "drizzle/0035_course_attendance.sql",
      "utf8",
    ).split("--> statement-breakpoint");
    // PostgreSQL requires the new enum value to commit before use.
    await client.unsafe(statements[0]);
    await client.begin(async (tx) => {
      await tx`select pg_advisory_xact_lock(654321035)`;
      for (const statement of statements.slice(1)) await tx.unsafe(statement);
    });
    console.log("Course attendance tables and RBAC permissions ready.");
  } finally {
    await client.end();
  }
}
main().catch(() => {
  console.error("Attendance migration failed");
  process.exitCode = 1;
});
