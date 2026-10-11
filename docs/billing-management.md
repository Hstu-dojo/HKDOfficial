# Billing management

Monthly training fees now share one policy across main admin, partner admin, student dashboards and the existing backup cron.

## Monthly fees and activity

- Fees use the amount and currency saved on the enrollment, rather than the current course price.
- A profile, enrollment, course and its organization must be active. An explicit inactive monthly status exempts that student from generation and reminders for that branch/month. Without an override, an active member is eligible.
- Enrollment dates must overlap the billing month. Zero-fee enrollments are not charged.
- The database enforces one fee per enrollment/month. Concurrent manual generation and cron runs skip an existing fee.
- `payment_due_day` in payment settings controls the due date (1–28); the default is the 15th. Dates use Asia/Dhaka, through the end of the due date.
- First-month fees created during admission use these same rules. Manual generation is also available for missed periods.
- Marking someone inactive stops new charges, student payment submission and reminders. It preserves existing invoices, verified payments and audit history; inactivity does not forgive historical debt. Use an explicit waiver where a charge should be forgiven.
- Partial verification records the **cumulative verified paid total**, in paisa on the API. UI entry uses taka with up to two decimal places. Rejecting later proof preserves previously verified payments.
- Verification, cash settlement, reversals and waivers are serialized with row locks and recorded in `monthly_fee_events` with the actual main/partner administrator ID.
- Aggregate collection cards, organization collection rates and partner financial graphs report BDT only, without treating other currencies as taka. Fee rows and reminder emails retain each invoice’s currency.
- Collection graphs group verified payments and remaining balances by the invoice’s billing month; they are not a bank cash-flow report. Payments awaiting verification remain outstanding in reports and are excluded from reminder recipients.

## Authorization and branch invoices

Main financial endpoints require `ADMIN_PANEL:ACCESS` plus their resource permission:

| Operation | Permission |
| --- | --- |
| Read student fees, unpaid balances, mail history | MONTHLY_FEE:READ |
| Generate monthly fees | MONTHLY_FEE:CREATE |
| Verify or reject payment proof | MONTHLY_FEE:VERIFY |
| Cash settlement, waiver, reversal, bulk reminder email | MONTHLY_FEE:MANAGE |
| Organization collections / invoices | PARTNER_BILL:READ |
| Create organization invoice | PARTNER_BILL:CREATE |
| Record organization payment | PARTNER_BILL:VERIFY |
| Cancel unsettled organization invoice | PARTNER_BILL:MANAGE |

`MANAGE` grants the other actions for its resource, as in the existing RBAC system. Student read permissions alone never expose admin financial records.

Partner admins use the existing separate partner session system. They manage the organization bound to their authenticated session; client-supplied partner IDs cannot expand that scope or grant main-admin access. Both the administrator and organization must remain active. A partner admin cannot settle or cancel the organization’s own invoices. Main admin manages these invoices under Organization Billing; the partner’s Bills page reads the same records. Organization invoices and students’ training fees are distinct obligations.

Students can read only their own profiles’ bills and submit proof for an eligible unpaid bill. The main dashboard and enrollment dashboard both display generated fees and link to the existing `/dashboard/pay-fee/[feeId]` route.

## SMTP and bulk reminders

Set these values in `.env.local` for local use and in the deployment environment for production:

```dotenv
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASSWORD=your-password
SMTP_FROM="Kaizen Karate Academy <billing@your-domain.com>"
NEXT_PUBLIC_APP_URL=https://www.hstuma.com
```

For implicit TLS on port 465, set `SMTP_SECURE=true`. Port 587 requires STARTTLS. `SMTP_FROM` falls back to `EMAIL_FROM_ADDRESS`; the other SMTP credentials are required. Credentials are never returned to the browser.

In Monthly Billing / Monthly Fees, select a month in **Balance reminders**. The preview lists unpaid balances and missing email addresses. **Email all students** sends one private email per eligible student, combining that student’s fees and keeping currencies separate. The academy email layout is reused, with HTML and plain-text versions and links to the student dashboard.

A durable campaign queue processes three recipients at a time. The UI continues batches and shows progress. Closing the page leaves remaining emails queued; resume through email history. Definite SMTP rejections can be retried. An interrupted or ambiguous send is marked `unknown` and is not automatically resent: inspect SMTP logs before starting a fresh campaign. `sent` means SMTP accepted the message, not proof of inbox delivery. History is retained in `billing_mail_deliveries`, with successful per-fee records in `payment_reminders` and updated reminder counters. The UI shows the latest 100 history entries, prioritizing unfinished sends.

## Existing daily backup cron

`vercel.json` still has its single daily `/api/cron/db-backup` job at 02:00 UTC (08:00 Bangladesh time).

1. The database backup and retention workflow runs first.
2. On the **5th**, generate the current month’s fees for eligible active enrollments.
3. On the **5th and 10th**, queue past-due fees up to the current month for currently active students, rechecking invoice/monthly activity and payment status before each send.
4. On every other date, skip billing work entirely.

Cron campaigns are keyed by the Bangladesh calendar date, preventing repeat sends from repeated executions that day. Current fees are included only after their actual due date. With the default due day of 15, reminders on the 5th and 10th cover prior unpaid periods.

Billing failures are caught and included in the response/logs without changing a successful backup’s result. The shared function reserves a bounded time budget; any remaining reminder queue is retained for resumption from main admin. No additional scheduled job is installed. Backup storage and `CRON_SECRET` must be configured as before.

## Database migration and checks

`drizzle/0025_billing_integrity.sql` adds mail/audit tables, fee uniqueness and branch-aware monthly activity uniqueness. It does not delete or rewrite financial records.

For an existing database previously managed using `db:push`, apply only this migration:

```bash
pnpm db:migrate:billing
```

The command checks duplicate enrollment/month groups and runs the migration in a single transaction with a migration lock. It stops if duplicates need reconciliation. It can safely be repeated and does not alter the existing Drizzle migration ledger. Databases maintained consistently through Drizzle migrations can use their usual migration workflow.

```bash
pnpm test:billing
pnpm test:rbac-access
```

The optional PostgreSQL integration check uses a disposable local Supabase database on port 54322, builds the baseline schema, applies the migration twice and exercises concurrent generation, payment updates, mail claims, activity overrides and branch invoices. SMTP is mocked and no configured application database is used:

```bash
pnpm test:billing:db
```
