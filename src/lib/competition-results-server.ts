import "server-only";
import { db } from "@/lib/connect-db";
import { competitionResults, profiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const publicResultFields = {
  id: competitionResults.id,
  profileId: competitionResults.profileId,
  eventName: competitionResults.eventName,
  eventDate: competitionResults.eventDate,
  category: competitionResults.category,
  placement: competitionResults.placement,
  athleteName: profiles.fullNameEnglish,
  athleteNameBangla: profiles.fullNameBangla,
};

export async function getPublishedCompetitionResults() {
  try {
    const rows = await db
      .select(publicResultFields)
      .from(competitionResults)
      .innerJoin(profiles, eq(competitionResults.profileId, profiles.id))
      .where(eq(competitionResults.isPublished, true))
      .orderBy(
        desc(competitionResults.eventDate),
        competitionResults.eventName,
        competitionResults.placement,
      );
    return {
      results: rows.map((row) => ({
        ...row,
        athleteName: row.athleteName || row.athleteNameBangla || "—",
      })),
      unavailable: false,
    };
  } catch (error) {
    console.error(
      "[Competition results] Failed to load published results:",
      error,
    );
    return { results: [], unavailable: true };
  }
}
