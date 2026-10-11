"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PanelLoader } from "@/components/loading";
type Bill = {
  id: string;
  month: string;
  course: string;
  currency: string;
  balance: number;
};
type Member = {
  profileId: string;
  name: string;
  email: string | null;
  bills: Bill[];
};
export default function MemberBillingReminders() {
  const [members, setMembers] = useState<Member[]>([]),
    [profileId, setProfileId] = useState(""),
    [months, setMonths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true),
    [sending, setSending] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [refresh, setRefresh] = useState(0),
    [sent, setSent] = useState(false);
  const campaign = useRef<string | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/partner-portal/member-reminders", { signal: abort.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load bills");
        if (!abort.signal.aborted) setMembers(data.members);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [refresh]);
  const member = members.find((m) => m.profileId === profileId),
    available = [...new Set(member?.bills.map((b) => b.month) || [])].sort();
  const bills = member?.bills.filter((b) => months.includes(b.month)) || [];
  const totals = bills.reduce<Record<string, number>>(
    (sum, b) => ({ ...sum, [b.currency]: (sum[b.currency] || 0) + b.balance }),
    {},
  );
  const money = (value: number, currency: string) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency }).format(
      value / 100,
    );
  function reset() {
    campaign.current = null;
    setSent(false);
    setMessage("");
    setError("");
  }
  async function send() {
    if (!member || !months.length) return;
    setSending(true);
    setError("");
    setMessage("");
    campaign.current ||= `manual:${crypto.randomUUID()}`;
    try {
      const response = await fetch("/api/partner-portal/member-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          months,
          campaignId: campaign.current,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to send selected bills");
      const accepted = result.counts?.sent || 0;
      setSent(accepted > 0);
      setMessage(
        accepted
          ? "Your mail server accepted the selected billing email. It is recorded in Email History."
          : `Email status: ${Object.entries(result.counts || {})
              .map(([status, count]) => `${count} ${status}`)
              .join(", ")}. Review Email History before sending again.`,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to send selected bills",
      );
    } finally {
      setSending(false);
    }
  }
  return (
    <section className="space-y-5 rounded-xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            Email a member’s unpaid bills
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Select a member and billing months. Only eligible active-month
            balances are included.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={sending || loading}
          onClick={() => {
            reset();
            setMonths([]);
            setRefresh((n) => n + 1);
          }}
        >
          Refresh bills
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {loading ? (
        <PanelLoader />
      ) : !members.length ? (
        <p className="text-sm text-muted-foreground">
          No eligible unpaid bills for active members.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <label htmlFor="billing-member" className="text-sm font-medium">
              Member
            </label>
            <select
              id="billing-member"
              className="h-11 w-full rounded-md border bg-background px-3 text-sm"
              value={profileId}
              disabled={sending}
              onChange={(e) => {
                reset();
                setProfileId(e.target.value);
                setMonths([]);
              }}
            >
              <option value="">Select a member…</option>
              {members.map((m) => (
                <option key={m.profileId} value={m.profileId}>
                  {m.name} — {m.email || "Email unavailable"}
                </option>
              ))}
            </select>
          </div>
          {member && (
            <>
              <div className="space-y-3">
                <p className="text-sm font-medium">Billing months</p>
                <div className="flex flex-wrap gap-3">
                  {available.map((month) => (
                    <label
                      key={month}
                      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                    >
                      <Checkbox
                        disabled={sending}
                        checked={months.includes(month)}
                        onCheckedChange={(checked) => {
                          reset();
                          setMonths((current) =>
                            checked
                              ? [...current, month].sort()
                              : current.filter((m) => m !== month),
                          );
                        }}
                      />
                      {new Intl.DateTimeFormat("en-BD", {
                        month: "long",
                        year: "numeric",
                        timeZone: "Asia/Dhaka",
                      }).format(new Date(`${month}-01T00:00:00+06:00`))}
                    </label>
                  ))}
                </div>
              </div>
              {bills.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/50">
                      <tr>
                        <th className="p-3 font-medium">Month / course</th>
                        <th className="p-3 text-right font-medium">
                          Unpaid balance
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bills.map((b) => (
                        <tr key={b.id} className="border-b last:border-0">
                          <td className="p-3">
                            <p>{b.month}</p>
                            <p className="text-xs text-muted-foreground">
                              {b.course}
                            </p>
                          </td>
                          <td className="whitespace-nowrap p-3 text-right">
                            {money(b.balance, b.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">
                    {Object.entries(totals)
                      .map(([currency, total]) => money(total, currency))
                      .join(" · ") || "Select billing months"}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    One email to {member.email || "email unavailable"} with the
                    selected months. Payments are checked again before sending.
                  </p>
                </div>
                <Button
                  disabled={sending || sent || !months.length || !member.email}
                  onClick={() => void send()}
                >
                  {sending
                    ? "Sending…"
                    : sent
                      ? "Email sent"
                      : "Send selected bills"}
                </Button>
              </div>
            </>
          )}
        </>
      )}
      <Link
        href="/partner-admin/portal/emails"
        className="inline-block text-sm text-primary underline underline-offset-4"
      >
        View organization email history
      </Link>
    </section>
  );
}
