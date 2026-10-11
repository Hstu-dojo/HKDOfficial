import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/connect-db";
import { faqs } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { defaultFaqs } from "./defaults";
const published = unstable_cache(
  async () =>
    db
      .select({ id: faqs.id, translations: faqs.translations })
      .from(faqs)
      .where(eq(faqs.isPublished, true))
      .orderBy(asc(faqs.displayOrder), asc(faqs.createdAt), asc(faqs.id)),
  ["homepage-faqs"],
  { revalidate: 300, tags: ["homepage-faqs"] },
);
export async function getPublishedFaqs() {
  try {
    return await published();
  } catch {
    console.error("[Homepage FAQs] Unable to load questions");
    return defaultFaqs;
  }
}
