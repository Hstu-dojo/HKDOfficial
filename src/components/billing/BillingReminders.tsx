"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, RefreshCw } from "lucide-react";
import { businessDate } from "@/lib/billing/policy";

type Recipient = {
  profileId: string;
  name: string;
  email: string | null;
  canEmail: boolean;
  balances: Record<string, number>;
  bills: {
    id: string;
    course: string;
    month: string;
    currency: string;
    balance: number;
    dueDate: string;
  }[];
};
type History = {
  id: string;
  campaignKey: string;
  scopeKey: string;
  name: string | null;
  email: string;
  billingMonth: string;
  status: string;
  error: string | null;
  createdAt: string;
  sentAt: string | null;
};
type Preview = {
  recipients: Recipient[];
  total: number;
  emailEligible: number;
  history: History[];
  campaigns?: History[];
};
type Campaign = {
  campaignKey: string;
  counts: Record<string, number>;
  remaining: number;
  complete: boolean;
  missingEmail?: number;
};
export function BillingReminders({
  endpoint,
  partnerId,
  canSend = true,
  showHistory = true,
}: {
  endpoint: string;
  partnerId?: string;
  canSend?: boolean;
  showHistory?: boolean;
}) {
  const [month, setMonth] = useState(() => businessDate().month),
    [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false),
    [sending, setSending] = useState(false),
    [error, setError] = useState<string | null>(null),
    [progress, setProgress] = useState<Campaign | null>(null);
  const alive = useRef(true),
    sequence = useRef(0);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      sequence.current++;
    };
  }, []);
  const url = useCallback(() => {
    const p = new URLSearchParams({ billingMonth: month });
    if (partnerId) p.set("partnerId", partnerId);
    return `${endpoint}?${p}`;
  }, [endpoint, month, partnerId]);
  const load = useCallback(async () => {
    const id = ++sequence.current;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url(), { cache: "no-store" }),
        data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load balances");
      if (alive.current && id === sequence.current) setPreview(data);
    } catch (e) {
      if (alive.current && id === sequence.current) {
        setPreview(null);
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    } finally {
      if (alive.current && id === sequence.current) setLoading(false);
    }
  }, [url]);
  useEffect(() => {
    void load();
  }, [load]);
  const send = async (existing?: History, retry = false) => {
    if (sending || !canSend) return;
    const campaignId = existing?.campaignKey || `manual:${crypto.randomUUID()}`;
    const billingMonth = existing?.billingMonth || month;
    setSending(true);
    setError(null);
    setProgress(null);
    try {
      let first = true;
      for (;;) {
        const res = await fetch(url(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billingMonth,
            campaignId,
            resume: !!existing || !first,
            retry: first && retry,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Could not send reminders");
        if (!alive.current) break;
        setProgress(data);
        if (data.remaining === 0) break;
        first = false;
      }
      if (alive.current) await load();
    } catch (e) {
      if (alive.current) {
        const message =
          e instanceof Error
            ? e.message
            : "Sending failed. Refresh history to resume queued emails.";
        await load();
        setError(message);
      }
    } finally {
      if (alive.current) setSending(false);
    }
  };
  const money = (n: number, c: string) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: c }).format(
      n / 100,
    );
  const resumable = Array.from(
    new Map(
      (showHistory ? preview?.history || [] : preview?.campaigns || [])
        .filter(
          (h) =>
            ["queued", "failed"].includes(h.status) &&
            (h.scopeKey === (partnerId || "all") ||
              endpoint.startsWith("/api/partner-portal/")),
        )
        .map((h) => [h.campaignKey, h]),
    ).values(),
  );
  return (
    <section
      className="min-w-0 overflow-hidden rounded-xl border bg-card shadow-sm"
      aria-label="Unpaid balances and reminders"
    >
      <div className="flex flex-col gap-4 border-b p-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Mail className="h-5 w-5 text-primary" />
            Balance reminders
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            Find unpaid fees for a month and email eligible active students
            together. Payments awaiting verification are excluded.
          </p>
        </div>
        <div className="flex shrink-0 items-end gap-2">
          <div className="space-y-1.5">
            <Label htmlFor={`reminder-month-${partnerId || "all"}`}>
              Billing month
            </Label>
            <Input
              id={`reminder-month-${partnerId || "all"}`}
              className="w-40"
              type="month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setProgress(null);
              }}
              disabled={sending}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => void load()}
            disabled={loading || sending}
            aria-label="Refresh balances"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-5 p-5">
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground" role="status">
            Checking balances…
          </p>
        ) : (
          preview && (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">
                    {preview.total} students with unpaid balances
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {preview.emailEligible} can receive email ·{" "}
                    {preview.total - preview.emailEligible} need a valid email
                    address
                  </p>
                </div>
                {canSend && (
                  <Button
                    onClick={() => void send()}
                    disabled={sending || !preview.emailEligible}
                  >
                    {sending
                      ? "Sending reminders…"
                      : `Email all ${preview.emailEligible} students`}
                  </Button>
                )}
              </div>
              {!!preview.recipients.length && (
                <div className="max-h-72 overflow-auto rounded-lg border">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="p-3 font-medium">Student</th>
                        <th className="p-3 font-medium">Training fees</th>
                        <th className="p-3 text-right font-medium">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.recipients.map((r) => (
                        <tr key={r.profileId} className="border-t">
                          <td className="p-3 align-top">
                            <p className="font-medium">{r.name}</p>
                            <p className="max-w-56 break-all text-xs text-muted-foreground">
                              {r.email || "No email address"}
                            </p>
                          </td>
                          <td className="p-3 align-top">
                            {r.bills.map((b) => (
                              <p
                                key={b.id}
                                className="min-w-32 text-xs text-muted-foreground"
                              >
                                {b.course}
                              </p>
                            ))}
                          </td>
                          <td className="p-3 text-right align-top">
                            {Object.entries(r.balances).map(([c, n]) => (
                              <p
                                key={c}
                                className="whitespace-nowrap font-medium"
                              >
                                {money(n, c)}
                              </p>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )
        )}
        {progress && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg bg-muted p-3 text-sm"
          >
            {progress.counts.sent || 0} accepted by SMTP ·{" "}
            {progress.counts.failed || 0} failed ·{" "}
            {progress.counts.unknown || 0} need delivery review ·{" "}
            {progress.remaining} queued
            {progress.missingEmail
              ? ` · ${progress.missingEmail} missing email`
              : ""}
          </p>
        )}
        {canSend &&
          resumable.map((h) => (
            <div
              key={h.campaignKey}
              className="flex flex-wrap items-center gap-3 rounded-lg border p-3 text-sm"
            >
              <span className="flex-1">
                Unfinished campaign for {h.billingMonth}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={sending}
                onClick={() => void send(h, h.status === "failed")}
              >
                {h.status === "failed"
                  ? "Retry failed emails"
                  : "Resume queued emails"}
              </Button>
            </div>
          ))}
        {showHistory && (
          <>
            <div>
              <h3 className="font-semibold">Email history</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                “Sent” means accepted by your SMTP server. Unconfirmed sends
                require checking SMTP logs before sending again.
              </p>
            </div>
            {!preview?.history.length ? (
              <p className="text-sm text-muted-foreground">
                No billing emails recorded yet.
              </p>
            ) : (
              <div className="max-h-80 overflow-auto rounded-lg border">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-muted">
                    <tr>
                      <th className="p-3 font-medium">Recipient</th>
                      <th className="p-3 font-medium">Date / campaign month</th>
                      <th className="p-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.history.map((h) => (
                      <tr key={h.id} className="border-t">
                        <td className="p-3 align-top">
                          <p>{h.name || "Student"}</p>
                          <p className="max-w-56 break-all text-xs text-muted-foreground">
                            {h.email}
                          </p>
                        </td>
                        <td className="min-w-28 p-3 align-top text-xs text-muted-foreground">
                          {new Intl.DateTimeFormat("en-BD", {
                            timeZone: "Asia/Dhaka",
                            dateStyle: "medium",
                          }).format(new Date(h.sentAt || h.createdAt))}
                          <br />
                          {h.billingMonth}
                        </td>
                        <td className="p-3 align-top">
                          <span className="inline-flex rounded-full border px-2.5 py-1 text-xs capitalize">
                            {h.status}
                          </span>
                          {h.error && (
                            <p className="mt-1 min-w-36 max-w-xs text-xs text-muted-foreground">
                              {h.error}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
