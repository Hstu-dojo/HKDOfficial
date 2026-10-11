const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, mocks = {}) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (n) => (Object.hasOwn(mocks, n) ? mocks[n] : require(n)),
      console: { error() {} },
      Date,
      Error,
      URL,
      process,
    },
    { filename: file },
  );
  return module.exports;
}
const policy = load("src/lib/rbac/admin-route-access.ts");
test("email history requires dedicated read permission plus panel access, even for ADMIN role", () => {
  const admin = {
    roles: [{ name: "ADMIN" }],
    permissions: [{ resource: "ADMIN_PANEL", action: "ACCESS" }],
  };
  assert.equal(policy.canAccessAdminRoute(admin, "/en/admin/emails"), false);
  assert.equal(
    policy.canAccessAdminRoute(
      {
        ...admin,
        permissions: [
          ...admin.permissions,
          { resource: "EMAIL", action: "READ" },
        ],
      },
      "/bn/admin/emails",
    ),
    true,
  );
  assert.equal(
    policy.canAccessAdminRoute(
      { ...admin, permissions: [{ resource: "EMAIL", action: "READ" }] },
      "/admin/emails",
    ),
    false,
  );
});
for (const allowed of [[], ["ADMIN_PANEL"], ["EMAIL"]])
  test(`API denies incomplete grants (${allowed.join(",")}) before reading emails`, async () => {
    const api = load("src/app/api/admin/emails/route.ts", {
      "@/lib/rbac/middleware": {
        getRBACContext: async () => ({ userId: "user" }),
      },
      "@/lib/rbac/permissions": {
        hasPermission: async (_, resource) => allowed.includes(resource),
      },
      "@/lib/email/history": {
        listEmailHistory: async () => {
          throw new Error("History leaked");
        },
      },
    });
    assert.equal(
      (await api.GET(new Request("https://academy.test/api/admin/emails")))
        .status,
      403,
    );
  });
test("API rejects anonymous callers and permits both grants", async () => {
  let context = null;
  const api = load("src/app/api/admin/emails/route.ts", {
    "@/lib/rbac/middleware": { getRBACContext: async () => context },
    "@/lib/rbac/permissions": { hasPermission: async () => true },
    "@/lib/email/history": {
      listEmailHistory: async () => ({ items: [], total: 0 }),
    },
  });
  const request = new Request("https://academy.test/api/admin/emails");
  assert.equal((await api.GET(request)).status, 401);
  context = { userId: "user" };
  assert.equal((await api.GET(request)).status, 200);
});
function history(failStorage = false) {
  const writes = [];
  const db = {
    insert: () => ({
      values: (value) => {
        writes.push(value.payload);
        return {
          returning: async () => {
            if (failStorage) throw new Error("DB offline");
            return [{ id: "log" }];
          },
        };
      },
    }),
    update: () => ({
      set: (value) => ({
        where: async () => {
          writes.push(value.payload);
        },
      }),
    }),
  };
  return {
    writes,
    ...load("src/lib/email/history.ts", {
      "server-only": {},
      "@/lib/connect-db": { db },
      "@/db/schema": { emailLog: { id: "id" } },
      "drizzle-orm": { eq: () => true, sql: () => "" },
    }),
  };
}
const meta = {
  category: "verification",
  provider: "resend",
  to: "student@example.test",
  subject: "Verify account",
};
test("records server acceptance without logging bodies, tokens or response data", async () => {
  const h = history();
  const response = {
    data: { id: "provider-id", token: "secret" },
    body: "password",
  };
  assert.equal(await h.trackEmail(meta, async () => response), response);
  assert.equal(h.writes[0].status, "sending");
  assert.equal(h.writes[1].status, "sent");
  assert.equal(h.writes[1].messageId, "provider-id");
  assert.ok(!JSON.stringify(h.writes).includes("secret"));
  assert.ok(!JSON.stringify(h.writes).includes("password"));
});
test("records returned failures, thrown failures and managed auth request status accurately", async () => {
  const h = history();
  await h.trackEmail(meta, async () => ({ error: { message: "Rejected" } }));
  assert.equal(h.writes.at(-1).status, "failed");
  await assert.rejects(
    h.trackEmail(meta, async () => {
      throw new Error("SMTP refused");
    }),
  );
  assert.equal(h.writes.at(-1).status, "failed");
  await h.trackEmail({ ...meta, provider: "supabase" }, async () => ({
    error: null,
  }));
  assert.equal(h.writes.at(-1).status, "requested");
});
test("history storage failure does not prevent sending or cause a duplicate dispatch", async () => {
  const h = history(true);
  let sends = 0;
  await h.trackEmail(meta, async () => {
    sends++;
    return { data: { id: "sent" } };
  });
  assert.equal(sends, 1);
});

test('main billing reminder response omits recipient history but keeps campaign controls', async () => {
 const handler=load('src/lib/billing/reminder-handler.ts', {
  'server-only':{}, '@/lib/connect-db':{db:{}}, '@/db/schema':{billingMailDeliveries:{}},
  './policy':{billingPeriod:()=>({})},
  './reminders':{reminderPreview:async()=>({recipients:[],total:0}),reminderHistory:async()=>[{campaignKey:'campaign',scopeKey:'all',billingMonth:'2026-10',status:'failed',email:'private@example.test',name:'Private Student'}]},
  './http':{billingErrorResponse:error=>{throw error;}},
 });
 const response=await handler.getReminders(new Request('https://academy.test/api/admin/monthly-fees/reminders?billingMonth=2026-10'),{},false);
 const json=await response.json();
 assert.equal(json.history.length,0);
 assert.equal(json.campaigns[0].campaignKey,'campaign');
 assert.ok(!JSON.stringify(json).includes('private@example.test'));
});
