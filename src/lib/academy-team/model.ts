import { z } from "zod";
import type {
  PersonCopy,
  PersonTranslations,
} from "@/db/schemas/content/academy-people";
const copy = z.object({
  name: z.string().trim().max(150),
  title: z.string().trim().max(150),
  rank: z.string().trim().max(100),
  summary: z.string().trim().max(600),
  biography: z.string().trim().max(12000),
});
export const personSchema = z
  .object({
    kind: z.enum(["sensei", "instructor", "black_belt"]),
    translations: z.object({
      en: copy.extend({
        name: z.string().trim().min(1).max(150),
        title: z.string().trim().min(1).max(150),
      }),
      bn: copy.partial().optional(),
      ne: copy.partial().optional(),
    }),
    bkfRegistrationNo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(
        /^(BKF\d{6,10})?$/,
        "Use a BKF registration number, e.g. BKF018642",
      )
      .default(""),
    blackBeltNo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^(D\d{5,10})?$/, "Use a black belt number, e.g. D03135")
      .default(""),
    profileUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (url) =>
          !url ||
          (() => {
            try {
              return new URL(url).protocol === "https:";
            } catch {
              return false;
            }
          })(),
        "Use an HTTPS profile URL",
      ),
    photoUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (url) =>
          !url ||
          (/^\/(?!\/)/.test(url) && !url.includes("\\")) ||
          (() => {
            try {
              return new URL(url).protocol === "https:";
            } catch {
              return false;
            }
          })(),
        "Use an HTTPS image URL or a local image path",
      ),
    displayOrder: z.number().int().min(0).max(9999),
    isPublished: z.boolean(),
  })
  .superRefine((person, ctx) => {
    if (
      person.isPublished &&
      !(person.kind === "sensei"
        ? person.translations.en.biography
        : person.translations.en.summary)
    )
      ctx.addIssue({
        code: "custom",
        path: [
          "translations",
          "en",
          person.kind === "sensei" ? "biography" : "summary",
        ],
        message:
          person.kind === "sensei"
            ? "Add a biography before publishing the sensei"
            : "Add a short profile before publishing",
      });
  });
export function localizedPerson(
  translations: PersonTranslations,
  locale: string,
): PersonCopy {
  const translated =
    locale === "bn"
      ? translations.bn
      : locale === "ne"
        ? translations.ne
        : undefined;
  return Object.fromEntries(
    Object.entries(translations.en).map(([key, value]) => [
      key,
      translated?.[key as keyof PersonCopy]?.trim() || value,
    ]),
  ) as PersonCopy;
}
