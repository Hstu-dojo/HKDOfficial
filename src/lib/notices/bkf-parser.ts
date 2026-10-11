import { load } from "cheerio";
import { createHash } from "node:crypto";
import type { FederationNotice } from "./model";
export const BKF_NOTICE_URL = "https://bkf.gov.bd/all-notice";
const months = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];
export function parseBKFNotices(html: string): FederationNotice[] {
  const $ = load(html),
    items: FederationNotice[] = [],
    seen = new Set<string>();
  $("table").each((_, table) => {
    if (
      !/Notice/i.test($(table).find("thead").text()) ||
      !/Published Date/i.test($(table).find("thead").text())
    )
      return;
    $(table)
      .find("tbody tr")
      .each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length < 2) return;
        const title = cells.eq(0).text().replace(/\s+/g, " ").trim(),
          rawDate = cells.eq(1).text().trim();
        const match = rawDate.match(/^(\d{1,2})\s+([a-z]{3}),?\s+(\d{4})$/i);
        if (!title || !match) return;
        const month = months.indexOf(match[2].toLowerCase());
        if (month < 0) return;
        const date = new Date(
          Date.UTC(Number(match[3]), month, Number(match[1])),
        );
        if (
          date.getUTCDate() !== Number(match[1]) ||
          date.getUTCMonth() !== month
        )
          return;
        let url = BKF_NOTICE_URL;
        const href = cells.eq(0).find("a").attr("href");
        if (href && href !== "#") {
          try {
            const target = new URL(href, BKF_NOTICE_URL);
            if (
              target.hostname === "bkf.gov.bd" &&
              ["http:", "https:"].includes(target.protocol) &&
              !target.username &&
              !target.password
            ) {
              target.protocol = "https:";
              url = target.href;
            }
          } catch {}
        }
        const publishedAt = date.toISOString(),
          key = `${title}|${publishedAt}`;
        if (seen.has(key)) return;
        seen.add(key);
        items.push({
          id: `bkf-${createHash("sha256").update(key).digest("hex").slice(0, 16)}`,
          title,
          url,
          publishedAt,
        });
      });
  });
  return items
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 100);
}
