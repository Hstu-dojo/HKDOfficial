import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { BKF_EVENTS_URL, parseBKFEvents, type BKFEvent } from "./bkf-events";
export type BKFEventFeed = {
  items: BKFEvent[];
  fetchedAt: string | null;
  unavailable: boolean;
  stale: boolean;
};
const fetchEvents = unstable_cache(
  async () => {
    const response = await fetch(BKF_EVENTS_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "text/html" },
    });
    if (!response.ok) throw new Error("BKF events unavailable");
    const html = await response.text();
    if (html.length > 2_000_000)
      throw new Error("BKF events response too large");
    return { items: parseBKFEvents(html), fetchedAt: new Date().toISOString() };
  },
  ["bkf-upcoming-events-v1"],
  { revalidate: 1800, tags: ["bkf-events"] },
);
// Failed refreshes throw inside unstable_cache so the last successful ISR entry stays available.
export const getBKFEvents = cache(async (): Promise<BKFEventFeed> => {
  try {
    const feed = await fetchEvents();
    return {
      ...feed,
      unavailable: false,
      stale: Date.now() - new Date(feed.fetchedAt).getTime() > 3600_000,
    };
  } catch {
    console.error("[BKF events] Upcoming feed unavailable");
    return { items: [], fetchedAt: null, unavailable: true, stale: false };
  }
});
