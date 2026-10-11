import { z } from "zod";
import type { FaqTranslations } from "@/db/schemas/content/faqs";
const copy = z
  .object({
    question: z.string().trim().max(250),
    answer: z.string().trim().max(4000),
  })
  .strict();
const translatedCopy = copy.refine(
  (v) => (!v.question && !v.answer) || (!!v.question && !!v.answer),
  "Provide both a question and an answer, or leave both blank",
);
export const faqSchema = z
  .object({
    translations: z
      .object({
        en: copy.extend({
          question: z.string().trim().min(1).max(250),
          answer: z.string().trim().min(1).max(4000),
        }),
        bn: translatedCopy.optional(),
        ne: translatedCopy.optional(),
      })
      .strict(),
    displayOrder: z.number().int().min(0).max(10000),
    isPublished: z.boolean(),
  })
  .strict();
export type PublicFaq = { id: string; translations: FaqTranslations };
export function faqCopy(translations: FaqTranslations, locale: string) {
  const copy = translations[locale === "bn" || locale === "ne" ? locale : "en"];
  return copy?.question?.trim() && copy?.answer?.trim()
    ? copy
    : translations.en;
}
