const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
function load(file, mocks = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (n) => mocks[n] || require(n),
      console,
      Date,
      URL,
      Request,
      Response,
      Headers,
      Buffer,
      process,
    },
  );
  return module.exports;
}
const model = load("src/lib/attendance/model.ts");
const input = () => ({
  courseId: "course",
  date: "2026-01-10",
  label: "Morning",
  notes: "",
  updatedAt: null,
  records: [{ profileId: "active", status: "present", notes: "" }],
});
test("register validates real dates, distinct students and explicit statuses", () => {
  assert.equal(model.attendanceInput.safeParse(input()).success, true);
  for (const change of [
    { date: "2026-02-30" },
    { label: " " },
    { records: [{ profileId: "active", status: "unmarked" }] },
    { records: [...input().records, ...input().records] },
  ])
    assert.equal(
      model.attendanceInput.safeParse({ ...input(), ...change }).success,
      false,
    );
});
test("attendance rate counts late as attended and excludes excused absences", () => {
  assert.equal(
    model.attendanceRate([
      { status: "present" },
      { status: "late" },
      { status: "absent" },
      { status: "excused" },
    ]),
    67,
  );
  assert.equal(model.attendanceRate([{ status: "excused" }]), null);
});
function route(options = {}) {
  const tables = Object.fromEntries(
    [
      "courses",
      "profiles",
      "user",
      "account",
      "partners",
      "courseEnrollments",
      "profileMonthlyStatus",
      "courseAttendanceSessions",
    ].map((name) => [
      name,
      new Proxy(
        { name },
        { get: (o, k) => (k === "name" ? name : `${name}.${String(k)}`) },
      ),
    ]),
  );
  const state = { saved: null, conditions: [], transactions: 0 };
  const students = [
    { profileId: "active", name: "Active Student", memberNumber: "KKA-1" },
  ];
  function builder() {
    let table;
    const rows = () =>
      table === tables.courses
        ? options.foreign
          ? []
          : [{ id: "course", partnerId: "branch", isActive: true }]
        : table === tables.courseAttendanceSessions
          ? options.existing
            ? [options.existing]
            : []
          : students;
    return {
      from(t) {
        table = t;
        return this;
      },
      innerJoin() {
        return this;
      },
      leftJoin() {
        return this;
      },
      where(c) {
        state.conditions.push(c);
        return this;
      },
      orderBy: async () => rows(),
      for: async () => rows(),
    };
  }
  const tx = {
    select: builder,
    selectDistinct: builder,
    execute: async () => {},
    insert: () => ({
      values(v) {
        state.saved = v;
        return { returning: async () => [v] };
      },
    }),
    update: () => ({
      set(v) {
        state.saved = v;
        return { where: () => ({ returning: async () => [v] }) };
      },
    }),
  };
  const db = {
    ...tx,
    transaction: async (cb) => {
      state.transactions++;
      return cb(tx);
    },
  };
  const sql = (parts, ...values) => ({ parts: [...parts], values });
  const mocks = {
    "@/lib/connect-db": { db },
    "@/db/schema": tables,
    "@/lib/partner-admin/auth": {
      requirePartnerAdminUser: async () => ({
        user:
          options.admin || options.anonymous
            ? null
            : { id: "operator", partnerId: "branch" },
      }),
    },
    "@/lib/rbac/middleware": {
      getRBACContext: async () =>
        options.admin ? { userId: "main-admin" } : null,
    },
    "@/lib/rbac/permissions": {
      hasPermission: async (_, r, a) =>
        (options.grants || []).includes(`${r}:${a}`),
    },
    "@/lib/attendance/model": model,
    "drizzle-orm": {
      eq: (field, value) => ({ field, value }),
      and: (...items) => items,
      asc: () => {},
      desc: () => {},
      sql,
    },
  };
  return { api: load("src/app/api/course-attendance/route.ts", mocks), state };
}
const request = (body = input()) =>
  new Request("https://branch.example.invalid/api/course-attendance", {
    method: "POST",
    body: JSON.stringify(body),
  });
test("anonymous callers and media-only admins cannot read registers", async () => {
  for (const options of [
    { anonymous: true },
    { admin: true, grants: ["ADMIN_PANEL:ACCESS", "GALLERY:MANAGE"] },
  ]) {
    const { api } = route(options);
    assert.equal(
      (
        await api.GET(
          new Request("https://site.example.invalid/api/course-attendance"),
        )
      ).status,
      403,
    );
  }
});
test("read-only attendance permission never grants recording", async () => {
  const { api, state } = route({
    admin: true,
    grants: ["ADMIN_PANEL:ACCESS", "ATTENDANCE:READ"],
  });
  assert.equal((await api.POST(request())).status, 403);
  assert.equal(state.transactions, 0);
});
test("partner may save only active roster entries in their own course", async () => {
  const valid = route();
  assert.equal((await valid.api.POST(request())).status, 200);
  assert.equal(valid.state.saved.partnerId, "branch");
  assert.equal(valid.state.saved.recordedBy, "partner-admin:operator");
  for (const options of [{ foreign: true }, {}]) {
    const { api, state } = route(options);
    assert.equal(
      (
        await api.POST(
          request({
            ...input(),
            records: [{ profileId: "foreign", status: "present", notes: "" }],
          }),
        )
      ).status,
      409,
    );
    assert.equal(state.saved, null);
  }
});
test("stale registers cannot overwrite newer edits", async () => {
  const { api, state } = route({
    existing: { updatedAt: new Date("2026-01-10T10:00:00Z"), records: [] },
  });
  assert.equal((await api.POST(request())).status, 409);
  assert.equal(state.saved, null);
});
test("inactive historical entries survive corrections but cannot be marked anew", async () => {
  const existing = {
    id: "saved",
    updatedAt: new Date("2026-01-10T10:00:00Z"),
    records: [
      {
        profileId: "inactive",
        name: "Past Student",
        memberNumber: "KKA-2",
        status: "absent",
        notes: "",
      },
    ],
  };
  const body = { ...input(), updatedAt: existing.updatedAt.toISOString() };
  const valid = route({ existing });
  assert.equal((await valid.api.POST(request(body))).status, 200);
  assert.equal(
    valid.state.saved.records.find((r) => r.profileId === "inactive").status,
    "absent",
  );
  const invalid = route({ existing });
  assert.equal(
    (
      await invalid.api.POST(
        request({
          ...body,
          records: [
            ...body.records,
            { profileId: "inactive", status: "present", notes: "" },
          ],
        }),
      )
    ).status,
    409,
  );
});
test("new future-date registers are rejected before database writes", async () => {
  const { api, state } = route();
  assert.equal(
    (await api.POST(request({ ...input(), date: "2999-01-01" }))).status,
    400,
  );
  assert.equal(state.transactions, 0);
});
test("roster query requires active enrollment, branch ownership, monthly activity and start date", async () => {
  const { api, state } = route();
  await api.POST(request());
  const text = JSON.stringify(state.conditions);
  for (const field of [
    "courseEnrollments.isActive",
    "profiles.isActive",
    "profiles.partnerId",
    "profileMonthlyStatus.isActive",
    "courseEnrollments.startDate",
  ])
    assert.ok(text.includes(field), field);
});
