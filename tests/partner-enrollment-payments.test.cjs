const test = require("node:test"),
  assert = require("node:assert/strict");
const {
  createLoader,
} = require("../mobile/partner-admin/shared/test-support/load.cjs");
function fixture(options = {}) {
  const tables = Object.fromEntries(
    [
      "enrollmentApplications",
      "courses",
      "members",
      "courseEnrollments",
      "monthlyFees",
    ].map((name) => [
      name,
      new Proxy(
        { name },
        { get: (t, k) => (k === "name" ? name : `${name}.${String(k)}`) },
      ),
    ]),
  );
  const state = {
    application: {
      id: "app",
      userId: "student-user",
      profileId: "student",
      status: options.status || "pending_payment",
      admissionFeeAmount: 20000,
      studentInfo: { fullNameEnglish: "Test Student" },
    },
    enrollments: 0,
    committed: false,
    locks: 0,
    writes: 0,
    billing: 0,
    conditions: [],
  };
  const course = {
    id: "course",
    partnerId: options.foreign ? "other" : "branch",
    name: "Training",
    isActive: !options.inactive,
    maxStudents: 30,
    currentStudents: options.full ? 30 : 0,
    duration: 6,
    monthlyFee: 20000,
    currency: "BDT",
  };
  const tx = {
    select() {
      let table;
      return {
        from(value) {
          table = value;
          return this;
        },
        innerJoin() {
          return this;
        },
        where(value) {
          state.conditions.push(value);
          return this;
        },
        for: async () => {
          state.locks++;
          return options.foreign
            ? []
            : [{ application: { ...state.application }, course }];
        },
        limit: async () =>
          table === tables.members
            ? [{ id: "student", partnerId: "branch", userId: "student-user" }]
            : table === tables.courseEnrollments
              ? state.enrollments
                ? [{ id: "enrollment" }]
                : []
              : [{ total: 1 }],
      };
    },
    update(table) {
      return {
        set(values) {
          return {
            where() {
              state.writes++;
              if (table === tables.enrollmentApplications)
                Object.assign(state.application, values);
              return {
                returning: async () => [{ ...state.application }],
                then: (resolve) => Promise.resolve().then(resolve),
              };
            },
          };
        },
      };
    },
    insert() {
      return {
        values() {
          state.enrollments++;
          if (options.failInsert) throw Error("Fixture insert failure");
          return { returning: async () => [{ id: "enrollment" }] };
        },
      };
    },
  };
  let queue = Promise.resolve();
  const db = {
    transaction(callback) {
      const run = queue.then(async () => {
        const snapshot = {
          application: { ...state.application },
          enrollments: state.enrollments,
        };
        try {
          const result = await callback(tx);
          state.committed = true;
          return result;
        } catch (e) {
          Object.assign(state, snapshot);
          throw e;
        }
      });
      queue = run.catch(() => {});
      return run;
    },
  };
  const api = createLoader(
    {
      "@/lib/connect-db": { db },
      "@/db/schemas/karate": tables,
      "@/lib/partner-admin/auth": {
        requirePartnerAdminUser: async () =>
          options.anonymous
            ? { error: Response.json({}, { status: 401 }) }
            : {
                user: {
                  id: "teacher",
                  name: "Teacher",
                  partnerId: "branch",
                  partnerSlug: "branch",
                },
              },
      },
      "@/lib/partner-assignment": {
        syncProgramRegistrationsProfileId: async () => {
          assert.equal(state.committed, true);
        },
      },
      "@/lib/billing/service": {
        generateInitialMonthlyFees: async () => {
          assert.equal(state.committed, true);
          state.billing++;
          return null;
        },
      },
      "drizzle-orm": {
        eq: (field, value) => ({ field, value }),
        and: (...conditions) => conditions,
        desc() {},
        count() {},
        sql: () => ({}),
      },
    },
    { console: { error() {} } },
  )("src/app/api/partner-portal/enrollment-applications/route.ts");
  const request = (action, details = {}) =>
    api.PATCH(
      new Request(
        "https://branch.example.invalid/api/partner-portal/enrollment-applications",
        {
          method: "PATCH",
          body: JSON.stringify({ applicationId: "app", action, ...details }),
        },
      ),
    );
  return { state, request };
}
test("a pending paper application can record cash later, then enroll and bill after commit", async () => {
  const { state, request } = fixture();
  assert.equal(
    (await request("record_payment", { paymentMethod: "cash" })).status,
    200,
  );
  assert.equal(state.application.status, "payment_verified");
  assert.equal(state.application.paymentMethod, "cash");
  assert.equal(state.application.transactionId, null);
  assert.ok(state.application.paymentVerifiedAt);
  assert.match(state.application.paymentVerificationNotes, /Teacher/);
  assert.equal(state.enrollments, 0);
  assert.equal((await request("approve")).status, 200);
  assert.equal(state.enrollments, 1);
  assert.equal(state.billing, 1);
  assert.equal(state.application.status, "approved");
  assert.equal(state.locks, 2);
  assert.ok(
    state.conditions.some(
      (c) =>
        Array.isArray(c) &&
        c.some((x) => x.field === "courses.partnerId" && x.value === "branch"),
    ),
  );
});
test("unpaid applications cannot enroll; non-cash receipts need a real reference", async () => {
  const { state, request } = fixture();
  assert.equal((await request("approve")).status, 400);
  for (const details of [
    { paymentMethod: "bkash" },
    { paymentMethod: "other" },
    { paymentMethod: "cash", transactionId: 42 },
  ])
    assert.equal((await request("record_payment", details)).status, 400);
  assert.equal(state.writes, 0);
  assert.equal(
    (
      await request("record_payment", {
        paymentMethod: "bkash",
        transactionId: "TXN-123",
      })
    ).status,
    200,
  );
  assert.equal(state.application.transactionId, "TXN-123");
});
test("foreign organization and anonymous callers cannot record payment", async () => {
  for (const options of [{ foreign: true }, { anonymous: true }]) {
    const { state, request } = fixture(options);
    assert.ok(
      [401, 404].includes(
        (await request("record_payment", { paymentMethod: "cash" })).status,
      ),
    );
    assert.equal(state.writes, 0);
  }
});
test("concurrent approval requests create only one enrollment", async () => {
  const { state, request } = fixture({ status: "payment_verified" });
  const responses = await Promise.all([request("approve"), request("approve")]);
  assert.deepEqual(responses.map((r) => r.status).sort(), [200, 400]);
  assert.equal(state.enrollments, 1);
  assert.equal(state.billing, 1);
});
test("cancelled payments cannot be reopened accidentally and unavailable courses cannot enroll", async () => {
  const canceled = fixture({ status: "cancelled" });
  assert.equal(
    (await canceled.request("record_payment", { paymentMethod: "cash" }))
      .status,
    400,
  );
  for (const options of [{ inactive: true }, { full: true }]) {
    const { state, request } = fixture({
      ...options,
      status: "payment_verified",
    });
    assert.equal((await request("approve")).status, 409);
    assert.equal(state.enrollments, 0);
  }
});
test("enrollment failure rolls back and never triggers monthly billing", async () => {
  const { state, request } = fixture({
    status: "payment_verified",
    failInsert: true,
  });
  assert.equal((await request("approve")).status, 500);
  assert.equal(state.application.status, "payment_verified");
  assert.equal(state.enrollments, 0);
  assert.equal(state.billing, 0);
});
