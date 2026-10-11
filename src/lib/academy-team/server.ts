import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/connect-db";
import { academyPeople } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
const published = unstable_cache(
  async () =>
    db
      .select({
        id: academyPeople.id,
        kind: academyPeople.kind,
        translations: academyPeople.translations,
        photoUrl: academyPeople.photoUrl,
        profileUrl: academyPeople.profileUrl,
        bkfRegistrationNo: academyPeople.bkfRegistrationNo,
        blackBeltNo: academyPeople.blackBeltNo,
      })
      .from(academyPeople)
      .where(eq(academyPeople.isPublished, true))
      .orderBy(
        asc(academyPeople.displayOrder),
        asc(academyPeople.createdAt),
        asc(academyPeople.id),
      ),
  ["academy-team"],
  { revalidate: 300, tags: ["academy-team"] },
);
export async function getPublishedAcademyPeople() {
  try {
    return await published();
  } catch {
    console.error("[Academy team] Unable to load published profiles");
    return [];
  }
}
