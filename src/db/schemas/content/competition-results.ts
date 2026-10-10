import {
  pgTable,
  text,
  date,
  integer,
  boolean,
  timestamp,
  uniqueIndex,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { profiles } from "../karate/members";
import { user } from "../auth/users";

export const competitionResults = pgTable(
  "competition_results",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    profileId: text("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "restrict" }),
    eventName: text("event_name").notNull(),
    eventDate: date("event_date").notNull(),
    category: text("category").notNull(),
    placement: integer("placement").notNull(),
    isPublished: boolean("is_published").notNull().default(false),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedBy: text("updated_by").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    entryUnique: uniqueIndex("competition_result_entry_unique").on(
      table.profileId,
      table.eventName,
      table.eventDate,
      table.category,
    ),
    publishedDate: index("competition_results_published_date_idx").on(
      table.isPublished,
      table.eventDate,
    ),
    validPlacement: check(
      "competition_result_placement_check",
      sql`${table.placement} between 1 and 128`,
    ),
  }),
);
