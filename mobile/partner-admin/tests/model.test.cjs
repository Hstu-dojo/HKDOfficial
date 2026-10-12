const test = require("node:test"),
  assert = require("node:assert/strict");
const { createLoader } = require("../shared/test-support/load.cjs");
const model = createLoader()("src/model.ts");
test("production origins require HTTPS without credentials, paths or query strings", () => {
  assert.equal(
    model.apiOrigin("https://afeac.p.hstuma.com"),
    "https://afeac.p.hstuma.com",
  );
  for (const value of [
    "http://www.hstuma.com",
    "https://user:secret@hstuma.com",
    "https://hstuma.com/admin",
    "https://hstuma.com?token=x",
  ])
    assert.throws(() => model.apiOrigin(value));
  assert.equal(
    model.apiOrigin("http://10.0.2.2:3000", true),
    "http://10.0.2.2:3000",
  );
});
test("business dates follow Bangladesh and date changes cross month/year safely", () => {
  assert.equal(
    model.businessDate(new Date("2026-10-11T20:00:00Z")),
    "2026-10-12",
  );
  assert.equal(model.shiftDate("2026-01-01", -1), "2025-12-31");
  assert.equal(model.shiftDate("2024-02-28", 1), "2024-02-29");
});
test("unmarked students remain explicit and historical inactive entries survive a roster refresh", () => {
  const rows = model.mergeRoster(
    [{ profileId: "current", name: "Current", memberNumber: "1" }],
    {
      records: [
        {
          profileId: "former",
          name: "Former",
          memberNumber: "2",
          status: "absent",
          notes: "Past",
        },
      ],
    },
  );
  assert.equal(rows[0].status, "unmarked");
  assert.equal(rows[1].status, "absent");
  assert.equal(rows[1].notes, "Past");
});
test("mobile rates match website semantics", () => {
  assert.equal(
    model.rate([
      { status: "present" },
      { status: "late" },
      { status: "absent" },
      { status: "excused" },
      { status: "unmarked" },
    ]),
    67,
  );
  assert.equal(model.rate([{ status: "unmarked" }]), null);
});
test("WebView navigation blocks executable and insecure external URLs", () => {
  assert.equal(
    model.portalNavigation(
      "https://www.hstuma.com/partner-admin",
      "https://www.hstuma.com",
    ),
    "internal",
  );
  assert.equal(
    model.portalNavigation("https://bkf.gov.bd", "https://www.hstuma.com"),
    "external",
  );
  for (const url of [
    "javascript:alert(1)",
    "file:///etc/passwd",
    "http://unknown.example",
  ])
    assert.equal(
      model.portalNavigation(url, "https://www.hstuma.com"),
      "blocked",
    );
});
test("CSV quotes multiline notes and escapes spreadsheet formulas", () => {
  const output = model.csv([
    {
      date: "2026-10-12",
      label: "Training",
      records: [
        {
          name: " =CMD()",
          memberNumber: "1",
          status: "present",
          notes: 'Line 1\n"Line 2"',
        },
      ],
    },
  ]);
  assert.ok(output.includes('"\' =CMD()"'));
  assert.ok(output.includes('"Line 1\n""Line 2"""'));
});
