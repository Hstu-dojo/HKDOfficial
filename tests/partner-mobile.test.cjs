const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript");
function load(file, mocks = {}, globals = {}) {
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
      URL,
      Date,
      Response,
      Request,
      console,
      process,
      ...globals,
    },
  );
  return module.exports;
}
const mobile = load("src/lib/partner-admin/mobile.ts");
test("mobile login issues a token only after credential checks; browser login keeps it HttpOnly", async () => {
  for (const mode of ["mobile", "browser", "bad-password", "inactive"]) {
    let inserted = 0;
    const row = {
      id: "admin",
      email: "fixture@example.invalid",
      name: "Admin",
      passwordHash: "fixture-hash",
      isActive: mode !== "inactive",
      partnerId: "branch",
      partnerName: "Branch",
      partnerSlug: "afeac",
      partnerActive: true,
    };
    const builder = () => ({
      from() {
        return this;
      },
      innerJoin() {
        return this;
      },
      where() {
        return this;
      },
      limit: async () => [row],
      orderBy: async () => [],
    });
    const route = load("src/app/api/partner-admin/login/route.ts", {
      "@/lib/org/domains": { isPlatformHost: () => true },
      "@/lib/org/domain-server": { resolveTenantHost: async () => null },
      "@/lib/connect-db": {
        db: {
          select: builder,
          delete: () => ({ where: async () => {} }),
          insert: () => ({
            values: async () => {
              inserted++;
            },
          }),
        },
      },
      "@/db/schemas/partner": {
        partners: {},
        partnerAdmins: {},
        partnerAdminSessions: {},
      },
      "@/lib/hash": { compare: async () => mode !== "bad-password" },
      "@/lib/partner-admin/auth": {
        PARTNER_ADMIN_SESSION_COOKIE: "kka_partner_admin_session",
      },
      "drizzle-orm": { eq: () => {}, sql: () => {} },
      "next/server": {
        NextResponse: {
          json(data, options) {
            const response = Response.json(data, options);
            response.cookies = { set() {} };
            return response;
          },
        },
      },
    });
    const response = await route.POST(
      new Request("https://www.hstuma.com/api/partner-admin/login", {
        method: "POST",
        headers: { host: "www.hstuma.com" },
        body: JSON.stringify({
          email: row.email,
          password: "fixture",
          client: mode === "browser" ? undefined : "mobile",
        }),
      }),
    );
    const body = await response.json();
    if (mode === "mobile") {
      assert.equal(response.status, 200);
      assert.match(body.token, /^[a-f0-9]{64}$/);
      assert.ok(new Date(body.expiresAt) > new Date());
    } else assert.equal(body.token, undefined);
    assert.equal(inserted, ["mobile", "browser"].includes(mode) ? 1 : 0);
  }
});
test("bearer parser requires a complete random session token", () => {
  const token = "ab".repeat(32);
  assert.equal(mobile.partnerBearerToken("Bearer " + token), token);
  for (const value of [
    null,
    "Bearer short",
    "Basic " + token,
    "Bearer " + token + " extra",
  ])
    assert.equal(mobile.partnerBearerToken(value), null);
});
test("portal handoff cannot redirect outside the partner portal", () => {
  for (const value of [
    "//evil.example",
    "https://evil.example",
    "/en/admin",
    "/partner-administrator",
    "/partner-admin\\evil",
    "/partner-admin/../en/admin",
    "/partner-admin/%2e%2e/en/admin",
    "/partner-admin/%2f..%2fadmin",
    "/partner-admin\nLocation: evil",
  ])
    assert.equal(mobile.partnerPortalPath(value), "/partner-admin");
  assert.equal(
    mobile.partnerPortalPath("/partner-admin/portal/bills"),
    "/partner-admin/portal/bills",
  );
});
test("native sessions retain expiration, active-admin and tenant isolation checks", async () => {
  for (const situation of [
    "valid",
    "inactive-admin",
    "inactive-branch",
    "wrong-tenant",
    "expired",
  ]) {
    const filters = [];
    const token = "ab".repeat(32);
    const row = {
      adminId: "operator",
      adminEmail: "fixture@example.invalid",
      adminName: "Operator",
      adminIsActive: situation !== "inactive-admin",
      partnerId: "branch",
      partnerName: "Branch",
      partnerSlug: "afeac",
      partnerActive: situation !== "inactive-branch",
    };
    const auth = load(
      "src/lib/partner-admin/auth.ts",
      {
        "@/lib/org/domains": { isPlatformHost: () => true },
        "@/lib/org/domain-server": {
          resolveTenantHost: async () =>
            situation === "wrong-tenant" ? "hkd" : null,
        },
        "next/headers": {
          cookies: async () => ({ get: () => undefined }),
          headers: async () =>
            new Headers({
              authorization: "Bearer " + token,
              host: "www.hstuma.com",
            }),
        },
        "@/lib/connect-db": {
          db: {
            select: () => ({
              from() {
                return this;
              },
              innerJoin() {
                return this;
              },
              where(value) {
                filters.push(value);
                return this;
              },
              limit: async () => (situation === "expired" ? [] : [row]),
            }),
          },
        },
        "@/db/schemas/partner": {
          partners: { id: "partner-id" },
          partnerAdmins: { partnerId: "admin-partner", id: "admin-id" },
          partnerAdminSessions: {
            token: "token",
            expiresAt: "expiry",
            partnerAdminId: "session-admin",
          },
        },
        "./mobile": mobile,
        "drizzle-orm": {
          eq: (field, value) => ({ field, value }),
          gt: (field, value) => ({ field, value }),
          and: (...items) => items,
        },
      },
      { Headers },
    );
    const result = await auth.getPartnerAdminUser();
    assert.equal(!!result, situation === "valid");
    assert.ok(JSON.stringify(filters).includes(token));
    assert.ok(JSON.stringify(filters).includes("expiry"));
  }
});
test("native cookie handoff rejects missing and unauthenticated bearer tokens", async () => {
  for (const authenticated of [false, true]) {
    const route = load("src/app/api/partner-admin/mobile-session/route.ts", {
      "@/lib/partner-admin/auth": {
        requirePartnerAdminUser: async () => ({
          user: null,
          error: Response.json({ error: "Expired" }, { status: 401 }),
        }),
      },
      "@/lib/partner-admin/mobile": mobile,
      "@/lib/connect-db": {
        db: {
          select() {
            throw Error("must not read unauthenticated storage");
          },
        },
      },
      "@/db/schema": { partnerAdminSessions: {} },
    });
    const response = await route.GET(
      new Request("https://www.hstuma.com/api/partner-admin/mobile-session", {
        headers: authenticated
          ? { Authorization: "Bearer " + "ab".repeat(32) }
          : {},
      }),
    );
    assert.equal(response.status, 401);
  }
});
test("native cookie handoff binds session to authenticated admin and never returns token in HTML or URL", async () => {
  const token = "ab".repeat(32),
    conditions = [],
    cookies = [];
  const table = {
    expiresAt: "expiry",
    token: "token",
    partnerAdminId: "admin",
  };
  const route = load("src/app/api/partner-admin/mobile-session/route.ts", {
    "@/lib/partner-admin/auth": {
      requirePartnerAdminUser: async () => ({
        user: { id: "owner" },
        error: null,
      }),
      PARTNER_ADMIN_SESSION_COOKIE: "kka_partner_admin_session",
    },
    "@/lib/partner-admin/mobile": mobile,
    "@/lib/connect-db": {
      db: {
        select: () => ({
          from() {
            return this;
          },
          where(value) {
            conditions.push(value);
            return this;
          },
          limit: async () => [{ expiresAt: new Date("2026-10-13T00:00:00Z") }],
        }),
      },
    },
    "@/db/schema": { partnerAdminSessions: table },
    "drizzle-orm": {
      eq: (f, v) => ({ f, v }),
      gt: (f, v) => ({ f, v }),
      and: (...args) => args,
    },
    "next/server": {
      NextResponse: {
        json: Response.json,
        redirect(url, status) {
          const response = new Response(null, {
            status,
            headers: { Location: url.toString() },
          });
          response.cookies = { set: (value) => cookies.push(value) };
          return response;
        },
      },
    },
  });
  const response = await route.GET(
    new Request(
      "https://www.hstuma.com/api/partner-admin/mobile-session?next=https://evil.example",
      { headers: { Authorization: "Bearer " + token } },
    ),
  );
  assert.equal(
    response.headers.get("Location"),
    "https://www.hstuma.com/partner-admin",
  );
  assert.equal(cookies[0].httpOnly, true);
  assert.ok(JSON.stringify(conditions).includes("owner"));
  assert.equal(await response.text(), "");
  assert.equal(response.headers.get("Cache-Control"), "private, no-store");
});
