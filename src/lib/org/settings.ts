import { z } from "zod";

export function safePublicUrl(value: unknown, local = false): string | null {
  if (typeof value !== "string") return null;
  const url = value.trim();
  if (!url || /[\\\u0000-\u0020]/.test(url)) return null;
  if (local && (/^\/(?!\/)/.test(url) || /^#[a-zA-Z][\w-]*$/.test(url)))
    return url;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password
      ? url
      : null;
  } catch {
    return null;
  }
}
const text = (max: number) => z.string().trim().max(max).nullable();
const url = (local: boolean) =>
  text(2000).refine(
    (v) => !v || !!safePublicUrl(v, local),
    "Use an HTTPS URL or a local page/image path",
  );
const imageUrl = text(2000).refine(
  (v) => !v || (!!safePublicUrl(v, true) && !v.startsWith("#")),
  "Use an HTTPS image URL or a local image path",
);
export const pageSettingsFields = z.object({
  heroImageUrl: imageUrl,
  heroTagline: text(500),
  aboutTitle: text(250),
  aboutText: text(12000),
  missionStatement: text(4000),
  logoUrl: imageUrl,
  accentColor: text(7).refine(
    (v) => !v || /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(v),
    "Use a valid hex color",
  ),
  founderName: text(250),
  founderTitle: text(250),
  founderImageUrl: imageUrl,
  founderBio: text(12000),
  galleryImages: z
    .array(
      z
        .string()
        .trim()
        .max(2000)
        .refine(
          (v) => !!safePublicUrl(v, true) && !v.startsWith("#"),
          "Invalid gallery image URL",
        ),
    )
    .max(60),
  features: z
    .array(
      z
        .object({
          icon: z.string().trim().max(100).default(""),
          title: z.string().trim().min(1).max(150),
          description: z.string().trim().max(1000).default(""),
        })
        .strict(),
    )
    .max(24),
  socialLinks: z
    .object({
      facebook: url(false)
        .transform((v) => v || "")
        .optional(),
      instagram: url(false)
        .transform((v) => v || "")
        .optional(),
      youtube: url(false)
        .transform((v) => v || "")
        .optional(),
      twitter: url(false)
        .transform((v) => v || "")
        .optional(),
      website: url(false)
        .transform((v) => v || "")
        .optional(),
    })
    .strict(),
  showStats: z.boolean(),
  showCourses: z.boolean(),
  showSchedule: z.boolean(),
  showGallery: z.boolean(),
  showFounder: z.boolean(),
  ctaText: text(250),
  ctaLink: url(true),
  yearEstablished: z
    .number()
    .int()
    .min(1800)
    .max(new Date().getUTCFullYear())
    .nullable(),
  announcement: text(1500),
  defaultScheduleDay: z.number().int().min(0).max(6).nullable(),
});
export const pageSettingsPatchSchema = pageSettingsFields
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "No valid fields to update");
export const partnerProfilePatchSchema = z
  .object({
    name: z.string().trim().min(1).max(250),
    description: text(12000),
    location: text(1000),
    contactEmail: z
      .string()
      .trim()
      .email()
      .max(320)
      .nullable()
      .or(z.literal("")),
    contactPhone: text(100),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "No valid fields to update");

/** Old rows may contain malformed JSON or URLs. Never let one field break a tenant page. */
export function normalizePageSettings(value: unknown) {
  const input =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const result: Record<string, unknown> = {};
  for (const [key, schema] of Object.entries(pageSettingsFields.shape)) {
    let candidate = input[key];
    if (
      (key === "galleryImages" || key === "features") &&
      Array.isArray(candidate)
    ) {
      const element =
        key === "galleryImages"
          ? pageSettingsFields.shape.galleryImages.element
          : pageSettingsFields.shape.features.element;
      candidate = candidate
        .slice(0, key === "galleryImages" ? 60 : 24)
        .flatMap((value) => {
          const parsed = element.safeParse(value);
          return parsed.success ? [parsed.data] : [];
        });
    }
    if (
      key === "socialLinks" &&
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate)
    ) {
      const links: Record<string, string> = {};
      for (const [platform, field] of Object.entries(
        pageSettingsFields.shape.socialLinks.shape,
      )) {
        const parsed = field.safeParse(
          (candidate as Record<string, unknown>)[platform],
        );
        if (parsed.success && parsed.data) links[platform] = parsed.data;
      }
      candidate = links;
    }
    const parsed = schema.safeParse(candidate);
    result[key] = parsed.success
      ? parsed.data
      : key.startsWith("show")
        ? true
        : key === "features" || key === "galleryImages"
          ? []
          : key === "socialLinks"
            ? {}
            : null;
  }
  return result as z.infer<typeof pageSettingsFields>;
}
export function tenantPageLinks(
  settings: ReturnType<typeof normalizePageSettings>,
  courses: number,
  schedules: number,
) {
  return [
    ...(settings.showCourses && courses > 0
      ? [{ label: "Programs", href: "#programs" }]
      : []),
    { label: "About", href: "#about" },
    ...(settings.showSchedule && schedules > 0
      ? [{ label: "Schedule", href: "#schedule" }]
      : []),
    ...(settings.showGallery && settings.galleryImages.length > 0
      ? [{ label: "Gallery", href: "#gallery" }]
      : []),
    { label: "Contact", href: "#contact" },
  ];
}
export function formatCourseFee(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  }
}

/** Avoid optimizing an already optimized Next image URL stored by an older editor. */
export function publicImageSource(value: string): string {
  let source = value;
  for (let pass = 0; pass < 3; pass++) {
    try {
      const parsed = new URL(source, "https://www.hstuma.com");
      if (parsed.pathname !== "/_next/image") break;
      const original = parsed.searchParams.get("url");
      if (
        !original ||
        !safePublicUrl(original, true) ||
        original.startsWith("#")
      )
        break;
      source = original;
    } catch {
      break;
    }
  }
  return source;
}
