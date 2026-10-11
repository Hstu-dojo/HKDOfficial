// App Router metadata routes own sitemap.xml and robots.txt.
// Keep this optional legacy generator from recreating conflicting public files.
module.exports = {
  siteUrl: process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://www.hstuma.com",
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  exclude: ["*"],
};
