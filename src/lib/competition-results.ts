export interface PublicCompetitionResult {
  id: string;
  profileId: string;
  eventName: string;
  eventDate: string;
  category: string;
  placement: number;
  athleteName: string;
  athleteNameBangla: string | null;
}

export function rankAthletes(results: PublicCompetitionResult[]) {
  const athletes = new Map<
    string,
    {
      profileId: string;
      name: string;
      nameBangla: string | null;
      gold: number;
      silver: number;
      bronze: number;
      entries: number;
      rank: number;
    }
  >();
  for (const result of results) {
    const athlete = athletes.get(result.profileId) ?? {
      profileId: result.profileId,
      name: result.athleteName,
      nameBangla: result.athleteNameBangla,
      gold: 0,
      silver: 0,
      bronze: 0,
      entries: 0,
      rank: 0,
    };
    if (result.placement === 1) athlete.gold++;
    if (result.placement === 2) athlete.silver++;
    if (result.placement === 3) athlete.bronze++;
    athlete.entries++;
    athletes.set(result.profileId, athlete);
  }
  const ranked = [...athletes.values()]
    .filter((a) => a.gold + a.silver + a.bronze > 0)
    .sort(
      (a, b) =>
        b.gold - a.gold ||
        b.silver - a.silver ||
        b.bronze - a.bronze ||
        a.name.localeCompare(b.name),
    );
  ranked.forEach((athlete, i) => {
    const previous = ranked[i - 1];
    athlete.rank =
      previous &&
      previous.gold === athlete.gold &&
      previous.silver === athlete.silver &&
      previous.bronze === athlete.bronze
        ? previous.rank
        : i + 1;
  });
  return ranked;
}
