import {
  pgTable,
  text,
  timestamp,
  date,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { courses } from "./courses";
import { partners } from "../partner";
export const courseAttendanceSessions = pgTable(
  "course_attendance_sessions",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    partnerId: text("partner_id")
      .notNull()
      .references(() => partners.id),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id),
    date: date("date").notNull(),
    label: text("label").notNull(),
    notes: text("notes").notNull().default(""),
    records: jsonb("records")
      .$type<
        {
          profileId: string;
          name: string;
          memberNumber: string;
          status: string;
          notes: string;
        }[]
      >()
      .notNull(),
    recordedBy: text("recorded_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    session: uniqueIndex("course_attendance_session_unique").on(
      t.courseId,
      t.date,
      t.label,
    ),
  }),
);
