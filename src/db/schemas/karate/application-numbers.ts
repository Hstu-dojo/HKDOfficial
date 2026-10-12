import { pgTable, integer, text, primaryKey, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { partners } from "../partner";
export const organizationApplicationCodes = pgTable(
  "organization_application_codes",
  {
    number: integer("number").primaryKey(),
    partnerId: text("partner_id")
      .unique()
      .references(() => partners.id, { onDelete: "set null" }),
  },
  (table) => ({
    range: check(
      "organization_application_codes_number_check",
      sql`${table.number} between 1 and 99`,
    ),
  }),
);
export const applicationNumberCounters = pgTable(
  "application_number_counters",
  {
    year: integer("year").notNull(),
    organizationNumber: integer("organization_number").notNull(),
    serial: integer("serial").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.year, table.organizationNumber] }),
    yearRange: check(
      "application_number_counters_year_check",
      sql`${table.year} between 2000 and 2099`,
    ),
    orgRange: check(
      "application_number_counters_organization_number_check",
      sql`${table.organizationNumber} between 0 and 99`,
    ),
    serialRange: check(
      "application_number_counters_serial_check",
      sql`${table.serial} between 1 and 999`,
    ),
  }),
);
