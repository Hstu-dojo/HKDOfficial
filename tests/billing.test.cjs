const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const { NextRequest } = require("next/server");
function load(file, mocks = {}) {
  const module = { exports: {} };
  const output = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInNewContext(
    output,
    {
      module,
      exports: module.exports,
      require: (n) => (Object.hasOwn(mocks, n) ? mocks[n] : require(n)),
      console: { log() {}, error() {}, warn() {} },
      process,
      URL,
      Date,
      setTimeout,
      clearTimeout,
    },
    { filename: file },
  );
  return module.exports;
}
const policy = load("src/lib/billing/policy.ts");
const transitions = load("src/lib/billing/transitions.ts", {
  "./policy": policy,
});
const now = new Date("2026-10-10T02:00:00Z");
const fee = {
  amount: 12345,
  amountPaid: 2000,
  status: "payment_submitted",
  dueDate: "2026-09-15T17:59:59.999Z",
};
test("billing dates respect Bangladesh midnight and only run on 5th/10th", () => {
  assert.equal(
    policy.scheduledBillingDay(new Date("2026-10-04T17:59:59Z")).remind,
    false,
  );
  assert.equal(
    policy.scheduledBillingDay(new Date("2026-10-04T18:00:00Z")).generate,
    true,
  );
  assert.equal(policy.scheduledBillingDay(now).generate, false);
  assert.equal(policy.scheduledBillingDay(now).remind, true);
  assert.equal(
    policy.scheduledBillingDay(new Date("2026-10-11T02:00:00Z")).remind,
    false,
  );
  assert.equal(
    policy.dueDateFor("2026-02", 15).toISOString(),
    "2026-02-15T17:59:59.999Z",
  );
  for (const value of ["2026-00", "2026-13", "2026-2", "2026-02-03", null])
    assert.throws(() => policy.billingPeriod(value));
});
test("partial and submitted balances remain outstanding; waivers reduce billable totals", () => {
  const summary = policy.summarizeFees(
    [
      { amount: 10000, amountPaid: 3000, status: "partial" },
      { amount: 10000, amountPaid: 2000, status: "payment_submitted" },
      { amount: 10000, amountPaid: 1000, status: "waived" },
      { amount: 10000, amountPaid: 10000, status: "paid" },
    ],
    now,
  );
  assert.equal(summary.collected, 16000);
  assert.equal(summary.outstanding, 15000);
  assert.equal(summary.totalAmount, 31000);
  assert.equal(summary.submitted, 1);
});
test("verified amounts cannot be negative, fractional, overpaid or decrease previous payments", () => {
  for (const amountPaid of [-1, 0, 2000, 1000, 12346, 2000.5, "3000", NaN])
    assert.throws(() =>
      transitions.transitionFee(
        fee,
        { action: "verify_payment", amountPaid },
        "admin",
        now,
      ),
    );
  assert.equal(
    transitions.transitionFee(
      fee,
      { action: "verify_payment", amountPaid: 5000 },
      "admin",
      now,
    ).status,
    "partial",
  );
  assert.equal(
    transitions.transitionFee(fee, { action: "verify_payment" }, "admin", now)
      .amountPaid,
    12345,
  );
});
test("rejecting partial proof retains verified balance; settled fees cannot be waived", () => {
  const patch = transitions.transitionFee(
    fee,
    { action: "reject_payment", notes: "Proof mismatch" },
    null,
    now,
  );
  assert.equal(patch.status, "partial");
  assert.equal(patch.paymentProofUrl, null);
  assert.equal(patch.amountPaid, undefined);
  for (const status of ["paid", "waived", "payment_submitted"])
    assert.throws(() =>
      transitions.transitionFee(
        { ...fee, status },
        { action: "waive", waiverReason: "test" },
        null,
        now,
      ),
    );
});
test("cash settles partial debt and reversal requires a reason and removes stale proof", () => {
  assert.equal(
    transitions.transitionFee(
      { ...fee, status: "partial" },
      { action: "mark_paid" },
      "admin",
      now,
    ).amountPaid,
    12345,
  );
  assert.throws(() =>
    transitions.transitionFee(
      { ...fee, status: "paid" },
      { action: "mark_unpaid" },
      "admin",
      now,
    ),
  );
  const patch = transitions.transitionFee(
    { ...fee, status: "paid" },
    { action: "mark_unpaid", notes: "Duplicate receipt" },
    "admin",
    now,
  );
  assert.equal(patch.amountPaid, 0);
  assert.equal(patch.paymentProofUrl, null);
  assert.equal(patch.verifiedBy, null);
});
test("decimal input preserves paisa and malformed amounts are rejected", () => {
  assert.equal(policy.paisaFromInput("123.45"), 12345);
  assert.equal(policy.paisaFromInput("0.01"), 1);
  for (const value of ["0", "-1", "1.001", "1e2", "Infinity", "999999999999"])
    assert.throws(() => policy.paisaFromInput(value));
});
const noStorage = new Proxy(
  {},
  {
    get() {
      throw new Error("Storage accessed before authorization");
    },
  },
);
const financialRoutes = [
  ["src/app/api/admin/monthly-fees/route.ts", "GET"],
  ["src/app/api/admin/monthly-fees/route.ts", "POST"],
  ["src/app/api/admin/monthly-fees/[feeId]/route.ts", "GET"],
  ["src/app/api/admin/monthly-fees/[feeId]/route.ts", "PUT"],
  ["src/app/api/admin/monthly-fees/reminders/route.ts", "GET"],
  ["src/app/api/admin/monthly-fees/reminders/route.ts", "POST"],
  ["src/app/api/admin/partner-bills/route.ts", "GET"],
  ["src/app/api/admin/partner-bills/route.ts", "POST"],
  ["src/app/api/admin/partner-bills/[billId]/route.ts", "PATCH"],
];
for (const [file, method] of financialRoutes)
  test(`${method} ${file} denies media-only and student accounts before storage`, async () => {
    for (const permissions of [
      [
        ["ADMIN_PANEL", "ACCESS"],
        ["MEDIA", "MANAGE"],
      ],
      [
        ["MONTHLY_FEE", "READ"],
        ["PARTNER_BILL", "READ"],
      ],
    ]) {
      const route = load(file, {
        "@/lib/rbac/middleware": {
          getRBACContext: async () => ({ userId: "caller" }),
        },
        "@/lib/rbac/permissions": {
          hasPermission: async (_id, r, a) =>
            permissions.some(
              ([resource, action]) =>
                r === resource && (a === action || action === "MANAGE"),
            ),
        },
        "@/lib/connect-db": { db: noStorage },
        "@/db/schema": {},
        "@/db/schemas/partner": {},
        "@/lib/billing/service": {},
        "@/lib/billing/update-fee": {},
        "@/lib/billing/transitions": transitions,
        "@/lib/billing/policy": policy,
        "@/lib/billing/http": {
          billingErrorResponse: (e) => {
            throw e;
          },
        },
        "@/lib/billing/reminder-handler": {},
        "@/lib/billing/invoices": {},
      });
      const request = new NextRequest(
        "http://localhost/api/admin/monthly-fees",
        { method, ...(method === "GET" ? {} : { body: "invalid JSON" }) },
      );
      const result = await route[method](request, {
        params: Promise.resolve({ feeId: "f", billId: "b" }),
      });
      assert.equal(result.status, 403);
    }
  });
test("billing errors cannot turn a successful backup into failure", async () => {
  let backup = 0,
    billing = 0;
  const route = load("src/app/api/cron/db-backup/route.ts", {
    "@/lib/backup/backup-service": {
      runBackupWorkflow: async () => {
        backup++;
        return {
          success: true,
          backup: { filename: "test", sizeKb: 1, bucket: "test" },
          pruning: { keptCount: 1, deletedCount: 0 },
        };
      },
    },
    "@/lib/storage/cloudflare-r2": { isR2Configured: () => true },
    "@/lib/billing/scheduled": {
      runScheduledBilling: async () => {
        billing++;
        throw new Error("SMTP unavailable");
      },
    },
  });
  const before = process.env.CRON_SECRET;
  process.env.CRON_SECRET = "test-secret";
  try {
    const result = await route.GET(
      new Request("http://localhost/api/cron/db-backup", {
        headers: { authorization: "Bearer test-secret" },
      }),
    );
    assert.equal(result.status, 200);
    assert.equal((await result.json()).success, true);
    assert.equal(backup, 1);
    assert.equal(billing, 1);
  } finally {
    if (before === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = before;
  }
});
test("ordinary dates skip generation and SMTP entirely", async () => {
  let calls = 0;
  const route = load("src/lib/billing/scheduled.ts", {
    "server-only": {},
    "./policy": policy,
    "./service": { generateMonthlyFees: async () => calls++ },
    "./reminders": {
      enqueueReminders: async () => calls++,
      campaignSummary: async () => calls++,
      processReminderBatch: async () => calls++,
    },
  });
  assert.equal(
    (await route.runScheduledBilling(new Date("2026-10-06T02:00:00Z"))).skipped,
    true,
  );
  assert.equal(calls, 0);
});

test("5th generates bills and reminds; 10th only reminds; generation failure leaves reminders available", async () => {
  for (const [date, generationFails, expectedGenerate] of [
    ["2026-10-05T02:00:00Z", false, 1],
    ["2026-10-10T02:00:00Z", false, 0],
    ["2026-10-05T02:00:00Z", true, 1],
  ]) {
    let generated = 0,
      queued = 0,
      sent = 0;
    const cron = load("src/lib/billing/scheduled.ts", {
      "server-only": {},
      "./policy": policy,
      "./service": {
        generateMonthlyFees: async () => {
          generated++;
          if (generationFails) throw new Error("Database rejected generation");
          return { count: 1 };
        },
      },
      "./reminders": {
        enqueueReminders: async () => {
          queued++;
          return { missingEmail: 0 };
        },
        campaignSummary: async () => ({ remaining: 1 }),
        processReminderBatch: async () => {
          sent++;
          return { remaining: 0, counts: { sent: 1 } };
        },
      },
    });
    const result = await cron.runScheduledBilling(new Date(date));
    assert.equal(generated, expectedGenerate);
    assert.equal(queued, 1);
    assert.equal(sent, 1);
    assert.equal(result.errors.length, generationFails ? 1 : 0);
  }
});
