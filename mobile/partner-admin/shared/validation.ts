import { z } from "zod";
import { attendanceStatuses } from "./types";
export const attendanceDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(value + "T00:00:00Z");
    return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }, "Select a valid date");
export const attendanceInput = z
  .object({
    courseId: z.string().min(1),
    date: attendanceDate,
    label: z.string().trim().min(1).max(80),
    notes: z.string().max(1000).default(""),
    updatedAt: z.string().datetime().nullable(),
    records: z
      .array(
        z
          .object({
            profileId: z.string().min(1),
            status: z.enum(attendanceStatuses),
            notes: z.string().max(300).default(""),
          })
          .strict(),
      )
      .max(2000),
  })
  .strict()
  .refine(
    (value) =>
      new Set(value.records.map((r) => r.profileId)).size ===
      value.records.length,
    "Duplicate students in register",
  );
