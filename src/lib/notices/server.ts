import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@/lib/connect-db";
import { notices, noticeFeeds } from "@/db/schema";
import { and, eq, desc, isNull, lte, or } from "drizzle-orm";
import { isNoticePublic } from "./model";
import type { AcademyNotice, FederationFeed } from "./model";
import { BKF_NOTICE_URL, parseBKFNotices } from "./bkf-parser";
const cachedAcademy = unstable_cache(
  async () =>
    db
      .select({
        id: notices.id,
        title: notices.title,
        content: notices.content,
        category: notices.category,
        priority: notices.priority,
        isPinned: notices.isPinned,
        isPublished: notices.isPublished,
        isArchived: notices.isArchived,
        publishedAt: notices.publishedAt,
        expiresAt: notices.expiresAt,
        translations: notices.translations,
        attachmentUrl: notices.attachmentUrl,
        updatedAt: notices.updatedAt,
      })
      .from(notices)
      .where(and(eq(notices.isPublished, true), eq(notices.isArchived, false)))
      .orderBy(
        desc(notices.isPinned),
        desc(notices.priority),
        desc(notices.publishedAt),
        desc(notices.createdAt),
      ),
  ["academy-notices-v1"],
  { revalidate: 60, tags: ["academy-notices"] },
);
export const getAcademyNotices = cache(async () => {
  try {
    const now = new Date();
    const rows = (await cachedAcademy()).filter((row) =>
      isNoticePublic(row, now),
    );
    return {
      items: JSON.parse(JSON.stringify(rows)) as AcademyNotice[],
      unavailable: false,
    };
  } catch {
    console.error("[Notices] Academy notices unavailable");
    return { items: [] as AcademyNotice[], unavailable: true };
  }
});
const cachedFederation = unstable_cache(
  async () => {
    // Throw on refresh failure so ISR keeps its last successful cache entry.
    const response = await fetch(BKF_NOTICE_URL, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: { Accept: "text/html" },
    });
    if (!response.ok) throw new Error(`BKF returned ${response.status}`);
    const html = await response.text();
    if (html.length > 2_000_000) throw new Error("BKF response too large");
    const items = parseBKFNotices(html);
    if (!items.length) throw new Error("BKF notice table unavailable");
    const fetchedAt = new Date();
    try {
      await db
        .insert(noticeFeeds)
        .values({ key: "bkf", items, fetchedAt })
        .onConflictDoUpdate({
          target: noticeFeeds.key,
          set: { items, fetchedAt },
        });
    } catch {
      console.error("[BKF notices] Could not persist the successful snapshot");
    }
    return { items, fetchedAt: fetchedAt.toISOString() };
  },
  ["bkf-notices-v1"],
  { revalidate: 1800, tags: ["bkf-notices"] },
);
export const getBKFNotices = cache(async (): Promise<FederationFeed> => {
  try {
    const feed = await cachedFederation();
    return {
      ...feed,
      stale: Date.now() - new Date(feed.fetchedAt).getTime() > 3600_000,
      unavailable: false,
    };
  } catch {
    console.error(
      "[BKF notices] Refresh unavailable; using last successful snapshot",
    );
    try {
      const [saved] = await db
        .select()
        .from(noticeFeeds)
        .where(eq(noticeFeeds.key, "bkf"))
        .limit(1);
      if (saved)
        return {
          items: saved.items,
          fetchedAt: saved.fetchedAt.toISOString(),
          stale: true,
          unavailable: false,
        };
    } catch {}
    return { items: [], fetchedAt: null, stale: false, unavailable: true };
  }
});
export async function getNoticeBoard() {
  const [academy, federation] = await Promise.all([
    getAcademyNotices(),
    getBKFNotices(),
  ]);
  return { academy, federation };
}
export const getPublicNotice = cache(
  async (id: string): Promise<AcademyNotice | null> => {
    const [row] = await db
      .select()
      .from(notices)
      .where(
        and(
          eq(notices.id, id),
          eq(notices.isPublished, true),
          eq(notices.isArchived, false),
          or(isNull(notices.publishedAt), lte(notices.publishedAt, new Date())),
        ),
      )
      .limit(1);
    return row ? JSON.parse(JSON.stringify(row)) : null;
  },
);
