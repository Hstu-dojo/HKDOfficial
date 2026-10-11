import { load } from "cheerio";
import { createHash } from "node:crypto";
export const BKF_EVENTS_URL = "https://bkf.gov.bd/event/upcoming";
export type BKFEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  applicationStart: string | null;
  applicationEnd: string | null;
  venue: string;
  url: string;
  applicationUrl: string | null;
};
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
export function parseBKFDate(text: string, endOfDay = false): string | null {
  const m = text
    .trim()
    .match(
      /^(\d{1,2})\s+([a-z]+),?\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM)?)?$/i,
    );
  if (!m) return null;
  const day = Number(m[1]),
    month = months.indexOf(m[2].toLowerCase().slice(0, 3)),
    year = Number(m[3]);
  let hour = m[4] ? Number(m[4]) : endOfDay ? 23 : 0;
  if (m[4] && hour <= 12 && m[7])
    hour = (hour % 12) + (m[7].toUpperCase() === "PM" ? 12 : 0);
  const minute = m[5] ? Number(m[5]) : endOfDay ? 59 : 0,
    second = m[6] ? Number(m[6]) : endOfDay ? 59 : 0;
  const date = new Date(Date.UTC(year, month, day, hour, minute, second));
  if (
    month < 0 ||
    hour > 23 ||
    minute > 59 ||
    second > 59 ||
    date.getUTCDate() !== day ||
    date.getUTCMonth() !== month ||
    date.getUTCFullYear() !== year
  )
    return null;
  return new Date(date.getTime() - 6 * 3600_000).toISOString();
}
function officialLink(href: string | undefined): string | null {
  if (!href || href === "#") return null;
  try {
    const url = new URL(href, BKF_EVENTS_URL);
    if (
      url.hostname === "bkf.gov.bd" &&
      ["https:", "http:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.port
    ) {
      url.protocol = "https:";
      return url.href;
    }
  } catch {}
  return null;
}
export function parseBKFEvents(html: string): BKFEvent[] {
  const $ = load(html);
  const heading = $("h3")
    .filter((_, el) => /Upcoming Events/i.test($(el).text()))
    .first();
  if (!heading.length) throw new Error("BKF upcoming section not recognized");
  const section = heading.closest("section");
  const items: BKFEvent[] = [];
  const seen = new Set<string>();
  section.find(".card").each((_, card) => {
    const el = $(card),
      title = el.find(".card-title").first().text().replace(/\s+/g, " ").trim();
    const dates = el
      .find(".card-body > small")
      .first()
      .text()
      .replace(/^\s*Date\s*:\s*/i, "")
      .trim()
      .split(/\s+To\s+/i);
    const startDate = parseBKFDate(dates[0] || ""),
      endDate = parseBKFDate(dates[1] || dates[0] || "");
    if (!title || !startDate || !endDate || endDate < startDate) return;
    let applicationStart: string | null = null,
      applicationEnd: string | null = null;
    el.find("h6").each((_, h) => {
      const label = $(h).text(),
        value = $(h).parent().find("span").first().text();
      if (/Application Start/i.test(label))
        applicationStart = parseBKFDate(value);
      if (/Application End/i.test(label))
        applicationEnd = parseBKFDate(value, true);
    });
    const links = el.find("a"),
      details = links
        .filter((_, a) => /View Details/i.test($(a).text()))
        .first(),
      apply = links.filter((_, a) => /Join Now/i.test($(a).text())).first();
    const key = title + "|" + startDate;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({
      id:
        "bkf-event-" +
        createHash("sha256").update(key).digest("hex").slice(0, 16),
      title,
      startDate,
      endDate,
      applicationStart,
      applicationEnd,
      venue: el
        .find(".card-footer")
        .text()
        .replace(/^\s*Venue\s*:\s*/i, "")
        .replace(/\s+/g, " ")
        .trim(),
      url: officialLink(details.attr("href")) || BKF_EVENTS_URL,
      applicationUrl: officialLink(apply.attr("href")),
    });
  });
  if (section.find(".card-title").length && !items.length)
    throw new Error("BKF event cards could not be parsed");
  return items
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 100);
}
