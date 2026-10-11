const test = require("node:test");
const assert = require("node:assert/strict");
require("tsx/cjs");
const { sanityImageLoader } = require("../src/lib/sanity-image-loader.ts");
const source =
  "https://cdn.sanity.io/images/project/production/photo.jpg?rect=100,20,800,600&w=1200&h=900&fit=crop";

test("responsive images go directly to Sanity and preserve the crop proportions", () => {
  const url = new URL(sanityImageLoader({ src: source, width: 640 }));
  assert.equal(url.origin, "https://cdn.sanity.io");
  assert.equal(url.searchParams.get("w"), "640");
  assert.equal(url.searchParams.get("h"), "480");
  assert.equal(url.searchParams.get("rect"), "100,20,800,600");
  assert.equal(url.searchParams.get("fit"), "crop");
  assert.equal(url.searchParams.get("auto"), "format");
  assert.equal(url.searchParams.get("q"), "75");
});
test("large srcset candidates do not enlarge bounded images", () => {
  const url = new URL(
    sanityImageLoader({ src: source, width: 3840, quality: 65 }),
  );
  assert.equal(url.searchParams.get("w"), "1200");
  assert.equal(url.searchParams.get("h"), "900");
  assert.equal(url.searchParams.get("q"), "65");
});
test("contained images retain their native aspect and GIF asset URL", () => {
  const url = new URL(
    sanityImageLoader({
      src: "https://cdn.sanity.io/images/project/production/practice.gif?w=400&fit=max",
      width: 256,
    }),
  );
  assert.equal(url.pathname.endsWith(".gif"), true);
  assert.equal(url.searchParams.get("h"), null);
  assert.equal(url.searchParams.get("fit"), "max");
  assert.equal(url.searchParams.get("w"), "256");
});
test("local and other provider images remain unchanged", () => {
  for (const src of ["/logo.svg", "https://example.com/photo.jpg"])
    assert.equal(sanityImageLoader({ src, width: 640 }), src);
});
