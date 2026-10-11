import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/connect-db";
import { testimonials } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
const approved = unstable_cache(
  async () =>
    db
      .select({
        id: testimonials.id,
        displayName: testimonials.displayName,
        affiliation: testimonials.affiliation,
        comment: testimonials.comment,
        rating: testimonials.rating,
      })
      .from(testimonials)
      .where(eq(testimonials.status, "approved"))
      .orderBy(desc(testimonials.reviewedAt), desc(testimonials.id))
      .limit(6),
  ["approved-testimonials"],
  { revalidate: 300, tags: ["testimonials"] },
);
export async function getApprovedTestimonials() {
  try {
    return await approved();
  } catch {
    console.error("[Testimonials] Public testimonials unavailable");
    return [];
  }
}
