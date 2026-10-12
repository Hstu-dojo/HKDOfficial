import "server-only";
import { sql } from "drizzle-orm";
import type { DbType } from "./connect-db";
export async function nextApplicationNumber(
  database: Pick<DbType, "execute">,
  partnerId: string | null,
) {
  const rows = await database.execute(
    sql`select next_enrollment_application_number(${partnerId}) as number`,
  );
  const number = rows[0]?.number;
  if (typeof number !== "string" || !/^\d{7}$/.test(number))
    throw Error("Could not allocate an application number");
  return number;
}
