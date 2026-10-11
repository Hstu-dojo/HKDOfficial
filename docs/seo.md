# Search and sharing setup

The App Router owns `/sitemap.xml`, `/blog/sitemap.xml`, `/google-news-sitemap.xml` and `/robots.txt`. Generated static copies in `public` were removed; do not run a legacy sitemap generator that recreates them.

- Set `SITE_URL` to the production canonical origin, normally `https://www.hstuma.com`. `NEXT_PUBLIC_APP_URL` is the fallback. Do not set either to a Vercel preview URL when evaluating production canonical links.
- Public translated pages use their own canonical URL and reciprocal `en`, `bn`, `ne` and `x-default` alternatives. The English-only journal uses `/blog/post/[slug]`; it has no fictional localized versions.
- The main sitemap includes academy pages, active courses/programs/branches, published albums and notices. Branch URLs use the existing tenant subdomains. Unpublished content, private dashboards, applications, auth pages, docs, template/demo pages and legacy numeric photo-viewer pages are excluded. Legacy pricing/services/developer pages are not promoted in the sitemap.
- Dynamic entries use actual database/CMS update times. Static entries omit `lastmod` rather than pretending they change on every request. Each database source fails independently. Sitemap sources revalidate every ten minutes; journal queries use published content and paginate beyond the old 1,500-post limit.
- Private route HTML carries `noindex, nofollow`; middleware also sets `X-Robots-Tag`. These HTML pages remain crawlable so engines can discover the noindex directive. API/auth machine endpoints are blocked in robots.txt. Public JS/CSS remain crawlable. Authentication and RBAC remain the actual access controls.
- Public pages have descriptive localized metadata, social preview images and canonical URLs. Dynamic courses, programs, albums, branch pages, notices and articles use their content. Draft previews are noindex.
- Structured data describes the academy organization/website, courses, scheduled program details where available, album galleries, article authors/dates and breadcrumbs. Dates/prices/addresses are not fabricated. JSON-LD is escaped before HTML serialization.
- Google News includes at most 1,000 journal entries with actual creation dates within the previous 48 hours. Updating an old story does not falsely republish it. The RSS feed is served with the RSS content type and valid absolute URLs.

## Production verification

Deploy the code, then open all three sitemaps and robots.txt. Add `GOOGLE_SITE_VERIFICATION` and/or `BING_SITE_VERIFICATION` in the hosting environment if using meta-tag ownership verification. Submit `/sitemap.xml` and `/blog/sitemap.xml` in Google Search Console and Bing Webmaster Tools after verifying the site. Search engine ownership/submission requires access to those external accounts; SMTP credentials do not provide that access.

Use Search Console URL Inspection and Google's Rich Results Test on representative academy, course, program and article pages. Inclusion in a sitemap does not guarantee indexing or rankings. Check private pages for `noindex` and remove any old submitted `/sitemap-0.xml` generated artifact. Keep the existing route redirects and locale paths intact.
