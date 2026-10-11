/** Disposable local PostgreSQL checks. Never uses DATABASE_URL or sends real email. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const postgres = require("postgres");
const Module = require("node:module");
const database = `kaizen_billing_test_${process.pid}`;
const admin = postgres(
  "postgres://postgres:postgres@127.0.0.1:54322/postgres",
  { prepare: false, max: 1, connect_timeout: 5, onnotice: () => {} },
);
const quote = (s) => '"' + s.replaceAll('"', '""') + '"';
let client;
const sent = [];
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === "server-only") return {};
  if (name === "nodemailer")
    return {
      createTransport: () => ({
        sendMail: async (message) => {
          sent.push(message);
          if (message.to === "reject@example.test")
            throw Object.assign(new Error("Rejected"), { responseCode: 550 });
          return { accepted: [message.to], messageId: message.messageId };
        },
        close() {},
      }),
    };
  return originalLoad.call(this, name, ...args);
};
require("tsx/cjs");
(async () => {
  try {
    await admin.unsafe(`CREATE DATABASE ${quote(database)}`);
    process.env.DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:54322/${database}`;
    Object.assign(process.env, {
      SMTP_HOST: "mock",
      SMTP_PORT: "587",
      SMTP_USER: "mock",
      SMTP_PASSWORD: "mock",
      SMTP_FROM: "Academy <billing@example.test>",
      NEXT_PUBLIC_APP_URL: "https://academy.example.test",
    });
    client = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 1,
      onnotice: () => {},
    });
    const snapshot = JSON.parse(
      fs.readFileSync("drizzle/meta/0024_snapshot.json", "utf8"),
    );
    for (const e of Object.values(snapshot.enums))
      await client.unsafe(
        `CREATE TYPE ${quote(e.name)} AS ENUM (${e.values.map((v) => "'" + v.replaceAll("'", "''") + "'").join(",")})`,
      );
    for (const t of Object.values(snapshot.tables)) {
      const columns = Object.values(t.columns).map(
        (c) =>
          `${quote(c.name)} ${c.typeSchema ? quote(c.typeSchema) + "." + quote(c.type) : c.type}${c.notNull ? " NOT NULL" : ""}${c.primaryKey ? " PRIMARY KEY" : ""}${c.default !== undefined ? " DEFAULT " + c.default : ""}`,
      );
      for (const u of Object.values(t.uniqueConstraints || {}))
        columns.push(`UNIQUE (${u.columns.map(quote).join(",")})`);
      for (const pk of Object.values(t.compositePrimaryKeys || {}))
        columns.push(`PRIMARY KEY (${pk.columns.map(quote).join(",")})`);
      await client.unsafe(
        `CREATE TABLE ${quote(t.name)} (${columns.join(",")})`,
      );
    }
    for (const t of Object.values(snapshot.tables))
      for (const i of Object.values(t.indexes || {})) {
        if (i.columns.some((c) => c.isExpression)) continue;
        await client.unsafe(
          `CREATE ${i.isUnique ? "UNIQUE " : ""}INDEX ${quote(i.name)} ON ${quote(t.name)} (${i.columns.map((c) => quote(c.expression)).join(",")})`,
        );
      }
    for (const t of Object.values(snapshot.tables))
      for (const fk of Object.values(t.foreignKeys || {}))
        await client.unsafe(
          `ALTER TABLE ${quote(t.name)} ADD CONSTRAINT ${quote(fk.name)} FOREIGN KEY (${fk.columnsFrom.map(quote).join(",")}) REFERENCES ${quote(fk.tableTo)} (${fk.columnsTo.map(quote).join(",")}) ON DELETE ${fk.onDelete || "no action"}`,
        );
    // Apply twice to verify that the targeted migration is safe to repeat.
    for (let pass = 0; pass < 2; pass++)
      for (const statement of fs
        .readFileSync("drizzle/0025_billing_integrity.sql", "utf8")
        .split("--> statement-breakpoint"))
        if (statement.trim()) await client.unsafe(statement);
    await client`INSERT INTO "user" (id,email,user_name,password,user_avatar) VALUES ('admin','admin@example.test','Admin','test',''),('student','student@example.test','Student','test','')`;
    await client`INSERT INTO partners(id,name,slug,is_active) VALUES ('a','Branch A','a',true),('b','Branch B','b',true),('inactive-partner','Inactive','inactive',false)`;
    await client`INSERT INTO profiles(id,user_id,member_number,full_name_english,email,partner_id,is_active) VALUES ('p','student','P1','Student','student@example.test','a',true),('inactive',NULL,'P2','Inactive','inactive@example.test','a',false),('monthly-inactive',NULL,'P3','Monthly inactive','monthly@example.test','a',true),('foreign',NULL,'P4','Other branch','foreign@example.test','b',true),('last-day',NULL,'P5','Last day','last@example.test','a',true),('rejected',NULL,'P6','SMTP rejection','reject@example.test','a',true)`;
    await client`INSERT INTO courses(id,name,duration,monthly_fee,partner_id) VALUES ('ca','A training',12,99000,'a'),('cb','B training',12,99000,'b'),('ci','Inactive training',12,99000,'inactive-partner')`;
    await client`INSERT INTO course_enrollments(id,course_id,profile_id,start_date,monthly_fee) VALUES ('ep','ca','p','2025-01-01',12345),('ei','ca','inactive','2025-01-01',12345),('em','ca','monthly-inactive','2025-01-01',12345),('ef','cb','foreign','2025-01-01',20000),('el','ca','last-day','2026-10-31T12:00:00+06:00',10050),('er','ca','rejected','2025-01-01',12345),('eip','ci','p','2025-01-01',10000),('ezero','ca','p','2025-01-01',0),('efuture','ca','p','2026-11-01',12345)`;
    await client`INSERT INTO profile_monthly_status(profile_id,partner_id,month,year,is_active) VALUES ('monthly-inactive','a',10,2026,false),('p','b',10,2026,false)`;
    await client`INSERT INTO course_enrollments(id,course_id,profile_id,start_date,expected_end_date,monthly_fee) VALUES ('eexpired','ca','p','2025-01-01','2026-09-20',12345)`;
    const service = require("../src/lib/billing/service.ts");
    const update = require("../src/lib/billing/update-fee.ts");
    const reminders = require("../src/lib/billing/reminders.ts");
    const invoices = require("../src/lib/billing/invoices.ts");
    const generation = await Promise.all([
      service.generateMonthlyFees("2026-10", { partnerId: "a" }, "user:admin"),
      service.generateMonthlyFees(
        "2026-10",
        { partnerId: "a" },
        "partner-admin:a-admin",
      ),
    ]);
    assert.equal(
      generation.reduce((sum, r) => sum + r.count, 0),
      3,
      "active members only; last calendar day is included",
    );
    const [price] =
      await client`SELECT amount FROM monthly_fees WHERE enrollment_id='ep'`;
    assert.equal(price.amount, 12345, "enrolled price is used");
    assert.equal(
      (await service.generateMonthlyFees("2026-10", { partnerId: "a" })).count,
      0,
      "repeat generation skips existing bills",
    );
    await service.generateMonthlyFees("2026-10", { partnerId: "b" });
    const rows = await service.feeRecords({ partnerId: "a" });
    assert.equal(rows.length, 3);
    const [foreignFee] =
      await client`SELECT id FROM monthly_fees WHERE enrollment_id='ef'`;
    await assert.rejects(
      () =>
        update.updateFee(
          foreignFee.id,
          { action: "mark_paid" },
          "partner-admin:a-admin",
          { partnerId: "a" },
        ),
      (e) => e.status === 404,
    );
    const student = rows.find((r) => r.enrollment.id === "ep");
    await update.updateFee(
      student.fee.id,
      {
        action: "submit_payment",
        transactionId: "TX1",
        paymentProofUrl: "https://example.test/proof",
      },
      "user:student",
      {},
      "p",
    );
    await update.updateFee(
      student.fee.id,
      { action: "verify_payment", amountPaid: 2000 },
      "partner-admin:a-admin",
      { partnerId: "a" },
    );
    const partial = await service.feeById(student.fee.id);
    assert.equal(partial.fee.status, "partial");
    assert.equal(partial.fee.amountPaid, 2000);
    assert.equal(
      (
        await service.listPartnerFees(
          new URLSearchParams("limit=1&page=1"),
          "a",
        )
      ).summary.collected,
      2000,
      "summary includes verified partial payments beyond pagination",
    );
    assert.equal(
      (await service.listPartnerFees(new URLSearchParams("q=Student"), "a"))
        .pagination.total,
      1,
    );
    assert.equal(
      (await service.listPartnerFees(new URLSearchParams("q=%"), "a"))
        .pagination.total,
      0,
      "search wildcards are literal",
    );
    await client`UPDATE monthly_fees SET currency='USD' WHERE id=${student.fee.id}`;
    const mixedCurrency = await service.listPartnerFees(
      new URLSearchParams(),
      "a",
    );
    assert.equal(
      mixedCurrency.summary.collected,
      0,
      "BDT aggregate never treats dollars as taka",
    );
    assert.equal(
      mixedCurrency.pagination.total,
      3,
      "non-BDT invoices remain visible",
    );
    await client`UPDATE monthly_fees SET currency='BDT' WHERE id=${student.fee.id}`;
    const concurrent = await Promise.allSettled([
      update.updateFee(student.fee.id, { action: "mark_paid" }, "user:admin"),
      update.updateFee(student.fee.id, { action: "mark_paid" }, "user:admin"),
    ]);
    assert.equal(
      concurrent.filter((r) => r.status === "fulfilled").length,
      1,
      "row locks prevent duplicate financial transitions",
    );
    await update.updateFee(
      student.fee.id,
      { action: "mark_unpaid", notes: "Test reversal" },
      "user:admin",
    );
    await client`UPDATE monthly_fees SET due_date='2026-09-15'`;
    const preview = await reminders.reminderPreview("2026-10", {
      partnerId: "a",
    });
    assert.equal(preview.emailEligible, 3);
    const campaign = "manual:00000000-0000-4000-8000-000000000001";
    await Promise.all([
      reminders.enqueueReminders({
        campaignKey: campaign,
        period: "2026-10",
        scope: { partnerId: "a" },
        actor: "partner-admin:a-admin",
      }),
      reminders.enqueueReminders({
        campaignKey: campaign,
        period: "2026-10",
        scope: { partnerId: "a" },
        actor: "partner-admin:a-admin",
      }),
    ]);
    await Promise.all([
      reminders.processReminderBatch(campaign, { partnerId: "a" }),
      reminders.processReminderBatch(campaign, { partnerId: "a" }),
    ]);
    assert.equal(
      sent.length,
      3,
      "concurrent reminder requests send once per recipient",
    );
    const summary = await reminders.campaignSummary(campaign, {
      partnerId: "a",
    });
    assert.equal(summary.counts.sent, 2);
    assert.equal(summary.counts.failed, 1);
    assert.equal(
      (await client`SELECT count(*)::int AS count FROM payment_reminders`)[0]
        .count,
      2,
      "successful mail history persisted",
    );
    const history = await reminders.reminderHistory({ partnerId: "b" });
    assert.equal(history.length, 0, "another partner cannot see email history");
    assert(
      sent[0].html.includes("Kaizen Karate Academy"),
      "email uses academy template",
    );
    await client`UPDATE profiles SET is_active=false WHERE id='p'`;
    assert.equal(
      await service.studentBillingEligible(student.fee.id, "p"),
      false,
    );
    await assert.rejects(
      () =>
        update.updateFee(
          student.fee.id,
          {
            action: "submit_payment",
            transactionId: "TX2",
            paymentProofUrl: "https://example.test/proof",
          },
          "user:student",
          {},
          "p",
        ),
      (e) => e.status === 404,
    );
    const invoice = await invoices.createInvoice(
      {
        id: "00000000-0000-4000-8000-000000000002",
        partnerId: "a",
        billingMonth: "2026-10",
        amount: 50000,
        currency: "BDT",
        description: "Branch service",
      },
      "admin",
    );
    assert.equal(
      (await invoices.listInvoices(new URLSearchParams(), "a")).bills.length,
      1,
    );
    assert.equal(
      (await invoices.listInvoices(new URLSearchParams(), "b")).bills.length,
      0,
    );
    await invoices.changeInvoice(invoice.id, "mark_paid", "Receipt 1", "admin");
    await assert.rejects(
      () => invoices.changeInvoice(invoice.id, "cancel", "Test", "admin"),
      (e) => e.status === 409,
    );
    assert.equal(
      (await client`SELECT count(*)::int AS count FROM partner_bill_events`)[0]
        .count,
      2,
    );
    const beforeAuthLoad = Module._load;
    Module._load = function (name, ...args) {
      if (name === "@/lib/partner-admin/auth")
        return {
          requirePartnerAdminUser: async () => ({
            user: { id: "a-admin", partnerId: "a" },
            error: null,
          }),
        };
      return beforeAuthLoad.call(this, name, ...args);
    };
    const activity = require("../src/app/api/partner-portal/monthly-status/route.ts");
    let response = await activity.POST(
      new Request("http://localhost/api/partner-portal/monthly-status", {
        method: "POST",
        body: JSON.stringify({
          profileId: "p",
          partnerId: "b",
          month: 10,
          year: 2026,
          isActive: false,
          notes: "Branch A status",
        }),
      }),
    );
    assert.equal(response.status, 200);
    const activities =
      await client`SELECT partner_id,notes FROM profile_monthly_status WHERE profile_id='p' ORDER BY partner_id`;
    assert.equal(activities.length, 2);
    assert.equal(activities[0].notes, "Branch A status");
    assert.equal(
      activities[1].notes,
      null,
      "monthly status never overwrites another branch",
    );
    response = await activity.PATCH(
      new Request("http://localhost/api/partner-portal/monthly-status", {
        method: "PATCH",
        body: JSON.stringify({
          month: 10,
          year: 2026,
          updates: [
            { profileId: "last-day", isActive: false },
            { profileId: "foreign", isActive: false },
          ],
        }),
      }),
    );
    assert.equal(
      response.status,
      403,
      "bulk update refuses cross-branch profile IDs",
    );
    assert.equal(
      (
        await client`SELECT count(*)::int AS count FROM profile_monthly_status WHERE profile_id='last-day'`
      )[0].count,
      0,
      "forbidden bulk update is atomic",
    );
    Module._load = beforeAuthLoad;

    // Selected member/month reminders and strict organization mail ownership.
    await client`INSERT INTO partners(id,name,slug,is_active) VALUES ('mail-a','Mail A','mail-a',true),('mail-b','Mail B','mail-b',true)`;
    await client`INSERT INTO profiles(id,member_number,full_name_english,email,is_active) VALUES ('mail-p','MP1','Mail Student','mail-student@example.test',true)`;
    await client`INSERT INTO courses(id,name,duration,monthly_fee,partner_id) VALUES ('mail-ca','Mail A training',12,10000,'mail-a'),('mail-cb','Mail B training',12,10000,'mail-b')`;
    await client`INSERT INTO course_enrollments(id,course_id,profile_id,start_date,monthly_fee) VALUES ('mail-ea','mail-ca','mail-p','2025-01-01',10000),('mail-eb','mail-cb','mail-p','2025-01-01',99900)`;
    await client`INSERT INTO monthly_fees(id,enrollment_id,profile_id,billing_month,billing_year,amount,amount_paid,status,due_date) VALUES
      ('mail-sep','mail-ea','mail-p','2026-09',2026,10000,2500,'partial','2026-09-15'),
      ('mail-oct','mail-ea','mail-p','2026-10',2026,10000,0,'pending','2026-10-15'),
      ('mail-aug','mail-ea','mail-p','2026-08',2026,10000,0,'pending','2026-08-15'),
      ('mail-other','mail-eb','mail-p','2026-09',2026,99900,0,'pending','2026-09-15')`;
    await client`INSERT INTO profile_monthly_status(profile_id,partner_id,month,year,is_active) VALUES ('mail-p','mail-a',8,2026,false)`;
    const eligibleSelected = await reminders.selectedUnpaidFees(
      { partnerId: "mail-a", profileId: "mail-p" },
      ["2026-08", "2026-09", "2026-10"],
    );
    assert.deepEqual(eligibleSelected.map((r) => r.fee.id).sort(), [
      "mail-oct",
      "mail-sep",
    ]);
    assert.equal(
      eligibleSelected.reduce(
        (sum, r) => sum + r.fee.amount - (r.fee.amountPaid || 0),
        0,
      ),
      17500,
    );
    const selectedCampaign = "manual:00000000-0000-4000-8000-000000000011";
    const memberHandlers = require("../src/lib/billing/member-reminders.ts");
    const selectedBody = {
      profileId: "mail-p",
      months: ["2026-09", "2026-10"],
      campaignId: selectedCampaign,
    };
    const selectedRequest = () =>
      new Request("https://example.test/api/partner-portal/member-reminders", {
        method: "POST",
        body: JSON.stringify(selectedBody),
      });
    const beforeSelected = sent.length;
    let selectedResponse = await memberHandlers.sendMemberReminders(
      selectedRequest(),
      "mail-a",
      "partner-admin:mail-admin",
    );
    assert.equal(selectedResponse.status, 200, await selectedResponse.text());
    assert.equal(
      sent.length,
      beforeSelected + 1,
      "two months are sent in a single member email",
    );
    assert.ok(
      sent.at(-1).text.includes("2026-09") &&
        sent.at(-1).text.includes("2026-10"),
    );
    assert.ok(
      !sent.at(-1).text.includes("2026-08") &&
        !sent.at(-1).text.includes("Mail B training"),
    );
    selectedResponse = await memberHandlers.sendMemberReminders(
      selectedRequest(),
      "mail-a",
      "partner-admin:mail-admin",
    );
    assert.equal(selectedResponse.status, 200);
    assert.equal(
      sent.length,
      beforeSelected + 1,
      "repeating a campaign never duplicates an email",
    );
    await client.unsafe("ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'EMAIL'");
    for (const statement of fs.readFileSync("drizzle/0030_newsletter.sql", "utf8").split("--> statement-breakpoint")) if(statement.trim()) await client.unsafe(statement);
    await client`INSERT INTO newsletter_broadcasts(source_key,subject,body,status) VALUES ('notice:global','Global newsletter','Global content','sent')`;
    // A student shared with another branch must not expose the first branch's email.
    const emailHistory = require("../src/lib/email/history.ts");
    await client`INSERT INTO "email-log"(payload) VALUES
      (${{ kind: "platform-email", partnerId: "mail-a", category: "password_reset", to: "mail-student@example.test", subject: "Owned request A", status: "requested", messageId: "resend-a", createdAt: new Date().toISOString() }}),
      (${{ kind: "platform-email", partnerId: "mail-b", category: "password_reset", to: "mail-student@example.test", subject: "Owned request B", status: "requested", messageId: "resend-b", createdAt: new Date().toISOString() }}),
      (${{ type: "email.delivered", data: { email_id: "resend-a", to: ["mail-student@example.test"], subject: "Owned event A" } }}),
      (${{ kind: "platform-email", category: "verification", to: "mail-student@example.test", subject: "Unscoped private request", status: "sent" }})`;
    const ownMail = await emailHistory.listEmailHistory(
      new URLSearchParams(),
      "mail-a",
    );
    assert.ok(ownMail.items.some((r) => r.id.startsWith("billing:")));
    assert.ok(ownMail.items.some((r) => r.subject === "Owned request A"));
    assert.ok(ownMail.items.some((r) => r.subject === "Owned event A"));
    assert.ok(
      !ownMail.items.some(
        (r) =>
          r.subject === "Owned request B" ||
          r.subject === "Unscoped private request" || r.subject === "Global newsletter",
      ),
    );
    const otherMail = await emailHistory.listEmailHistory(
      new URLSearchParams(),
      "mail-b",
    );
    assert.ok(
      !otherMail.items.some(
        (r) => r.scopeKey === "mail-a" || r.subject === "Owned event A",
      ),
    );
    const pausedCampaign = "manual:00000000-0000-4000-8000-000000000012";
    await reminders.enqueueReminders({
      campaignKey: pausedCampaign,
      period: "2026-10",
      scope: { partnerId: "mail-a", profileId: "mail-p" },
      actor: "partner-admin:mail-admin",
      selectedMonths: ["2026-09", "2026-10"],
    });
    await client`INSERT INTO profile_monthly_status(profile_id,partner_id,month,year,is_active) VALUES ('mail-p','mail-a',10,2026,false)`;
    await reminders.processReminderBatch(pausedCampaign, {
      partnerId: "mail-a",
      profileId: "mail-p",
    });
    assert.equal(
      sent.length,
      beforeSelected + 1,
      "activity is rechecked immediately before SMTP",
    );
    assert.equal(
      (
        await reminders.selectedUnpaidFees({
          partnerId: "mail-a",
          profileId: "mail-p",
        })
      ).length,
      0,
    );

    console.log(
      "PASS: migration, active billing, enrolled pricing, concurrent generation/payment/mail, pagination totals, partner isolation, SMTP failure history, inactive students, branch invoices, selected multi-month member mail and strict organization email history.",
    );
  } finally {
    if (global.kaizenPostgresClient) await global.kaizenPostgresClient.end();
    if (client) await client.end();
    await admin.unsafe(
      `DROP DATABASE IF EXISTS ${quote(database)} WITH (FORCE)`,
    );
    await admin.end();
    Module._load = originalLoad;
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
