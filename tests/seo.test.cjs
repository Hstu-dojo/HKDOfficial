const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
require("tsx/cjs");
const seo = require("../src/lib/seo/site.ts");
const { withSeoRequest } = require("../src/lib/seo/request.ts");
const { NextRequest, NextResponse } = require("next/server");
test("translated canonical and language alternatives are reciprocal and normalized", () => {
  for (const locale of seo.seoLocales) {
    const data = seo.requestMetadata(`/${locale}/gallery`);
    assert.equal(
      data.alternates.canonical,
      seo.absoluteUrl(`/${locale}/gallery`),
    );
    assert.equal(Object.keys(data.alternates.languages).length, 4);
    assert.equal(data.openGraph.url, data.alternates.canonical);
    assert(data.description);
    assert(!data.alternates.canonical.includes("//en/"));
  }
});
test("private and application routes cannot be indexed; journal has no fictional locales", () => {
  for (const path of [
    "/en/admin/gallery",
    "/bn/dashboard",
    "/partner-admin",
    "/ne/karate/courses/id/apply/success",
    "/docs/database",
    "/en/auth-debug",
  ]) {
    assert(seo.privatePath(path), path);
    assert.equal(seo.requestMetadata(path).robots.index, false);
  }
  const blog = seo.pageMetadata({ path: "/blog/post/story", title: "Story" });
  assert.equal(blog.alternates.languages, undefined);
  assert.equal(blog.alternates.canonical, seo.absoluteUrl("/blog/post/story"));
});
test("SEO header forwarding preserves auth cookies and existing middleware overrides", () => {
  const request = new NextRequest("https://www.hstuma.com/bn/dashboard", {
    headers: { cookie: "session=original", "x-seo-pathname": "/en/forged" },
  });
  const response = NextResponse.next({
    request: { headers: new Headers({ cookie: "session=refreshed" }) },
  });
  response.cookies.set("updated", "yes");
  const result = withSeoRequest(request, response);
  assert.equal(
    result.headers.get("x-middleware-request-cookie"),
    "session=refreshed",
  );
  assert.equal(
    result.headers.get("x-middleware-request-x-seo-pathname"),
    "/bn/dashboard",
  );
  assert.equal(result.headers.get("x-robots-tag"), "noindex, nofollow");
  assert(result.headers.get("set-cookie").includes("updated=yes"));
});
test("JSON-LD cannot break out of its script element", () => {
  const value = seo.jsonLd({ name: "</script><script>bad</script>" });
  assert(!value.includes("</script>"));
  assert.equal(JSON.parse(value).name, "</script><script>bad</script>");
});
function loadSitemap(galleryFails = false) {
  const module = { exports: {} };
  const tables = {
    courses: { id: "cid", isActive: "ca", updatedAt: "cu" },
    programs: { slug: "ps", isActive: "pa", updatedAt: "pu" },
    partners: { slug: "os", isActive: "oa", updatedAt: "ou" },
    galleryFolders: { slug: "gs", isPublished: "gp", updatedAt: "gu" },
  };
  const date = new Date("2026-09-20");
  const db = {
    select() {
      return {
        from(table) {
          return {
            where() {
              if (table === tables.galleryFolders && galleryFails)
                return Promise.reject(new Error("Gallery unavailable"));
              return Promise.resolve(
                table === tables.courses
                  ? [{ id: "course-id", updatedAt: date }]
                  : table === tables.programs
                    ? [{ slug: "real-program", updatedAt: date }]
                    : table === tables.partners
                      ? [{ slug: "hstu-main", updatedAt: date }]
                      : [{ slug: "published-album", updatedAt: date }],
              );
            },
          };
        },
      };
    },
  };
  const mocks = {
    "@/lib/connect-db": { db },
    "@/db/schema": tables,
    "drizzle-orm": { eq: () => true },
    "@/lib/seo/site": seo,
    "@/lib/seo/content": {
      publishedDocuments: async () => [
        { _type: "post", slug: "notice-slug", _updatedAt: date.toISOString() },
      ],
    },
  };
  const output = ts.transpileModule(
    fs.readFileSync("src/app/sitemap.ts", "utf8"),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  vm.runInNewContext(output, {
    module,
    exports: module.exports,
    require: (name) => mocks[name],
    console: { error() {} },
    process,
    Date,
    encodeURIComponent,
  });
  return module.exports.default();
}
test("sitemap uses real route forms and dates while excluding private and nonexistent pages", async () => {
  const entries = await loadSitemap();
  const urls = entries.map((e) => e.url);
  assert(urls.includes(seo.absoluteUrl("/en/karate/courses/course-id")));
  assert(urls.includes(seo.absoluteUrl("/bn/gallery/published-album")));
  assert(urls.includes(seo.absoluteUrl("/notice/notice-slug")));
  assert(urls.includes("https://hstu-main.p.hstuma.com/"));
  assert(
    !urls.some((u) => /\/docs|\/admin|\/dashboard|\/en\/blog|\/p\//.test(u)),
  );
  assert.equal(
    entries.find((e) => e.url === seo.absoluteUrl("/en")).lastModified,
    undefined,
  );
  assert.equal(
    new Date(
      entries.find((e) => e.url.includes("course-id")).lastModified,
    ).toISOString(),
    "2026-09-20T00:00:00.000Z",
  );
});
test("a failed gallery query does not remove other sitemap sources", async () => {
  const entries = await loadSitemap(true);
  assert(entries.some((e) => e.url.includes("course-id")));
  assert(entries.some((e) => e.url.includes("notice-slug")));
  assert(!entries.some((e) => e.url.includes("published-album")));
});
