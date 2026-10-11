import * as React from "react";
import { Section, Heading, Text, Button } from "@react-email/components";
import EmailLayout from "../emailLayout";
export type BillingEmailRow = {
  course: string;
  month: string;
  currency: string;
  amount: number;
  paid: number;
  dueDate: string;
};
export function BillingReminderEmail({
  name,
  rows,
  dashboardUrl,
  hasAccount,
}: {
  name: string;
  rows: BillingEmailRow[];
  dashboardUrl: string;
  hasAccount: boolean;
}) {
  const money = (n: number, c: string) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: c }).format(
      n / 100,
    );
  const totals = rows.reduce<Record<string, number>>((s, r) => {
    s[r.currency] = (s[r.currency] || 0) + r.amount - r.paid;
    return s;
  }, {});
  return (
    <EmailLayout preview="Your outstanding academy fees and payment details">
      <Section style={{ padding: "28px", fontFamily: "Arial, sans-serif" }}>
        <Text
          style={{
            color: "#008d9c",
            fontSize: "12px",
            letterSpacing: "2px",
            textTransform: "uppercase",
          }}
        >
          Your academy account
        </Text>
        <Heading
          style={{
            color: "#39235b",
            fontFamily: "Georgia, serif",
            fontSize: "30px",
            fontWeight: 400,
          }}
        >
          A reminder about your fees.
        </Heading>
        <Text>Hello {name},</Text>
        <Text style={{ color: "#5d5767", lineHeight: "24px" }}>
          Our records show the following outstanding training fees. Payments
          awaiting verification are excluded. If you have recently paid, please
          contact your branch administrator.
        </Text>
        <table
          width="100%"
          cellPadding="10"
          style={{
            borderCollapse: "collapse",
            fontSize: "13px",
            textAlign: "left",
          }}
        >
          <thead>
            <tr style={{ background: "#f2eef8", color: "#39235b" }}>
              <th>Training / month</th>
              <th>Due date</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #e7e1ef" }}>
                <td>
                  {r.course}
                  <br />
                  <span style={{ color: "#666" }}>{r.month}</span>
                </td>
                <td>{r.dueDate}</td>
                <td>{money(r.amount - r.paid, r.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Section
          style={{
            background: "#eaf8f7",
            padding: "12px 18px",
            marginTop: "20px",
          }}
        >
          {Object.entries(totals).map(([currency, total]) => (
            <Text key={currency} style={{ color: "#144e53", fontWeight: 600 }}>
              Outstanding balance: {money(total, currency)}
            </Text>
          ))}
        </Section>
        {hasAccount ? (
          <>
            <Button
              href={dashboardUrl}
              style={{
                background: "#6431c9",
                borderRadius: "6px",
                color: "#fff",
                padding: "14px 22px",
                marginTop: "24px",
              }}
            >
              View bills &amp; submit payment
            </Button>
            <Text style={{ fontSize: "12px", color: "#666" }}>
              Sign in to review your fees and use your academy’s payment
              instructions.
            </Text>
          </>
        ) : (
          <Text>
            Please contact your branch administrator to arrange payment and
            receive a receipt.
          </Text>
        )}
        <Text style={{ color: "#5d5767", lineHeight: "22px" }}>
          Thank you for training with Kaizen Karate Academy.
        </Text>
      </Section>
    </EmailLayout>
  );
}
