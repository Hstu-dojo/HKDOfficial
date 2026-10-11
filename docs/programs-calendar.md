# Programs calendar

`/{locale}/karate/programs` keeps existing academy program detail/registration routes and now displays a separate Bangladesh Karate Federation calendar. Purple academy badges and aqua federation badges distinguish the organizers. The academy program-type filter affects only academy entries. Federation applications open on BKF, never in the academy registration flow.

Source: https://bkf.gov.bd/event/upcoming. The server-only parser extracts the Upcoming Events section, event dates, application windows, venue and official detail/application links. It ignores unrelated tournament sections and accepts links only on `bkf.gov.bd`. Titles and venues remain as published by BKF; the surrounding interface is translated into English, Bangla and Nepali.

Dates are interpreted in Bangladesh time, including BKF's mixed 24-hour times with AM/PM suffixes. Application end dates run through 23:59:59 Bangladesh time. Expired events are excluded from the upcoming panel. An upcoming event with a closed application window remains visible and is labeled Registration closed. Application links appear only during a known open window when BKF actually publishes a link. A missing detail link falls back to the official calendar.

The Next Data Cache refreshes every 30 minutes without a cron job or extra environment variables. Failed refreshes throw to preserve the last successful ISR entry. A cold cache during an upstream outage displays a federation unavailable state with the official listing link; academy programs remain independent. Recognized empty lists can clear expired source data, while unrecognized/error pages cannot overwrite a valid cached feed.

Run `pnpm test:bkf-events` for source parsing, timezone, empty-page and unsafe-link checks. The UI was checked with live academy and BKF data at desktop and 320px/375px widths, in all three locales and dark mode.
