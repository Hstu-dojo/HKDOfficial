import {
  pgTable,
  text,
  jsonb,
  boolean,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "../auth";
export type FaqCopy = { question: string; answer: string };
export type FaqTranslations = { en: FaqCopy; bn?: FaqCopy; ne?: FaqCopy };
export const faqs = pgTable("faqs", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  translations: jsonb("translations").$type<FaqTranslations>().notNull(),
  displayOrder: integer("display_order").notNull().default(0),
  isPublished: boolean("is_published").notNull().default(false),
  createdBy: text("created_by").references(() => user.id, {
    onDelete: "set null",
  }),
  updatedBy: text("updated_by").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 })
    .notNull()
    .defaultNow(),
});
