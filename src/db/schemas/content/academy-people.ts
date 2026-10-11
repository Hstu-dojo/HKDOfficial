import {
  pgTable,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth";
export type PersonCopy = {
  name: string;
  title: string;
  rank: string;
  summary: string;
  biography: string;
};
export type PersonTranslations = {
  en: PersonCopy;
  bn?: Partial<PersonCopy>;
  ne?: Partial<PersonCopy>;
};
export const academyPeople = pgTable(
  "academy_people",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    kind: text("kind")
      .$type<"sensei" | "instructor" | "black_belt">()
      .notNull(),
    translations: jsonb("translations").$type<PersonTranslations>().notNull(),
    bkfRegistrationNo: text("bkf_registration_no").notNull().default(""),
    blackBeltNo: text("black_belt_no").notNull().default(""),
    profileUrl: text("profile_url").notNull().default(""),
    photoUrl: text("photo_url").notNull().default(""),
    displayOrder: integer("display_order").notNull().default(0),
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
    oneSensei: uniqueIndex("academy_people_published_sensei_idx")
      .on(table.kind)
      .where(sql`${table.kind} = 'sensei' AND ${table.isPublished} = true`),
    kindCheck: check(
      "academy_people_kind_check",
      sql`${table.kind} IN ('sensei','instructor','black_belt')`,
    ),
  }),
);
