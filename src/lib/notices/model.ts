import { z } from "zod";
import { safePublicUrl } from "@/lib/org/settings";
export const categories = [
  "general",
  "training",
  "competition",
  "grading",
  "holiday",
] as const;
export type NoticeCategory = (typeof categories)[number];
const translated = z
  .object({
    title: z.string().trim().max(240).default(""),
    content: z.string().trim().max(16000).default(""),
  })
  .strict();
export const noticeSchema = z
  .object({
    title: z.string().trim().min(3).max(240),
    content: z.string().trim().min(5).max(16000),
    category: z.enum(categories).default("general"),
    priority: z.number().int().min(0).max(2).default(0),
    isPinned: z.boolean().default(false),
    isPublished: z.boolean().default(false),
    isArchived: z.boolean().default(false),
    publishedAt: z.string().datetime({ offset: true }).nullable().default(null),
    expiresAt: z.string().datetime({ offset: true }).nullable().default(null),
    attachmentUrl: z
      .string()
      .trim()
      .max(2000)
      .refine(
        (v) => !v || (!!safePublicUrl(v, true) && !v.startsWith("#")),
        "Use an HTTPS attachment URL or a local file path",
      )
      .default(""),
    translations: z
      .object({ bn: translated.optional(), ne: translated.optional() })
      .strict()
      .default({}),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.isPublished && value.isArchived)
      ctx.addIssue({
        code: "custom",
        message: "An archived notice cannot be published",
      });
    if (
      value.expiresAt &&
      new Date(value.expiresAt) <= new Date(value.publishedAt || Date.now())
    )
      ctx.addIssue({
        code: "custom",
        path: ["expiresAt"],
        message: "Expiry must be after publication",
      });
  });
export type NoticeInput = z.infer<typeof noticeSchema>;
export type AcademyNotice = {
  id: string;
  title: string;
  content: string;
  category: string;
  priority: number;
  isPinned: boolean;
  publishedAt: string | null;
  expiresAt: string | null;
  attachmentUrl: string;
  translations: Record<string, { title?: string; content?: string }>;
};
export type FederationNotice = {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
};
export type FederationFeed = {
  items: FederationNotice[];
  fetchedAt: string | null;
  stale: boolean;
  unavailable: boolean;
};
export function noticeText(
  notice: Pick<AcademyNotice, "title" | "content" | "translations">,
  locale: string,
) {
  const translation = notice.translations?.[locale];
  return {
    title: translation?.title?.trim() || notice.title,
    content: translation?.content?.trim() || notice.content,
  };
}
export function isNoticePublic(
  row: {
    isPublished: boolean;
    isArchived: boolean;
    publishedAt: Date | string | null;
  },
  now = new Date(),
) {
  return (
    row.isPublished &&
    !row.isArchived &&
    (!row.publishedAt || new Date(row.publishedAt) <= now)
  );
}
export function isNoticeExpired(
  row: { expiresAt: string | Date | null },
  now = new Date(),
) {
  return !!row.expiresAt && new Date(row.expiresAt) <= now;
}
// Browser and Node ICU locale support differs (notably Nepali). Keep SSR and
// hydration output identical instead of relying on the runtime's locale fallback.
const noticeMonths = {
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  bn: [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ],
  ne: [
    "जनवरी",
    "फेब्रुअरी",
    "मार्च",
    "अप्रिल",
    "मे",
    "जुन",
    "जुलाई",
    "अगस्ट",
    "सेप्टेम्बर",
    "अक्टोबर",
    "नोभेम्बर",
    "डिसेम्बर",
  ],
};
export function noticeDate(value: string | null, locale = "en") {
  if (!value) return "";
  const date = new Date(new Date(value).getTime() + 6 * 60 * 60 * 1000);
  if (Number.isNaN(date.getTime())) return "";
  const language = locale === "bn" || locale === "ne" ? locale : "en";
  const digits =
    language === "bn"
      ? "০১২৩৪৫৬৭৮৯"
      : language === "ne"
        ? "०१२३४५६७८९"
        : "0123456789";
  const number = (n: number) =>
    String(n).replace(/\d/g, (digit) => digits[Number(digit)]);
  const month = noticeMonths[language][date.getUTCMonth()];
  return language === "en"
    ? `${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
    : `${number(date.getUTCDate())} ${month} ${number(date.getUTCFullYear())}`;
}
export function noticeHref(id: string, locale = "en") {
  return `/notice/${encodeURIComponent(id)}${locale === "en" ? "" : `?lang=${locale}`}`;
}
export function dhakaInput(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Dhaka",
  })
    .format(new Date(value))
    .replace(" ", "T");
}
export function dhakaISO(value: string) {
  return value ? new Date(`${value}:00+06:00`).toISOString() : null;
}

export function noticeSummary(content: string, max = 280) {
  return content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/[#*_>`~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}
export function noticePreview(notice: AcademyNotice): AcademyNotice {
  return {
    ...notice,
    content: noticeSummary(notice.content),
    translations: Object.fromEntries(
      Object.entries(notice.translations).map(([locale, copy]) => [
        locale,
        {
          ...copy,
          content: copy.content ? noticeSummary(copy.content) : undefined,
        },
      ]),
    ),
  };
}
