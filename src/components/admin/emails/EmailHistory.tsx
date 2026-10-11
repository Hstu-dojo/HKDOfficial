"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PanelLoader } from "@/components/loading";
type Email = {
  id: string;
  recipient: string;
  subject: string;
  category: string;
  provider: string;
  status: string;
  createdAt: string | null;
  sentAt: string | null;
  messageId: string | null;
  error: string | null;
};
type Result = { items: Email[]; page: number; limit: number; total: number };
export default function EmailHistory() {
  const [q, setQ] = useState(""),
    [category, setCategory] = useState(""),
    [status, setStatus] = useState(""),
    [page, setPage] = useState(1),
    [refresh, setRefresh] = useState(0);
  const [data, setData] = useState<Result | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/admin/emails?${new URLSearchParams({ q, category, status, page: String(page) })}`,
          { signal: abort.signal },
        );
        const result = await response.json();
        if (!response.ok)
          throw new Error(result.error || "Unable to load email history");
        setData(result);
      } catch (e) {
        if (!abort.signal.aborted)
          setError(
            e instanceof Error ? e.message : "Unable to load email history",
          );
      } finally {
        if (!abort.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      abort.abort();
    };
  }, [q, category, status, page, refresh]);
  const date = (value: string | null) =>
    value && Number.isFinite(Date.parse(value))
      ? new Intl.DateTimeFormat("en-BD", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "Asia/Dhaka",
        }).format(new Date(value))
      : "Date unavailable";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Emails</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Platform email attempts, billing reminders and provider delivery
            events.
          </p>
        </div>
        <Button variant="outline" onClick={() => setRefresh((n) => n + 1)}>
          Refresh
        </Button>
      </div>
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Input
            aria-label="Search email recipient or subject"
            placeholder="Search recipient or subject…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            aria-label="Email category"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {[
              "billing",
              "verification",
              "credentials",
              "password_reset",
              "signup",
              "contact",
              "quotation",
              "provider_event",
            ].map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <select
            aria-label="Email status"
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            {[
              "queued",
              "sending",
              "sent",
              "requested",
              "failed",
              "unknown",
              "skipped",
              "email.delivered",
              "email.bounced",
              "email.complained",
              "email.opened",
              "email.clicked",
            ].map((s) => (
              <option key={s} value={s}>
                {s.replace("email.", "")}
              </option>
            ))}
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          Sent means the mail server accepted the message. Requested means
          Supabase accepted an authentication request; delivery is unconfirmed.
          Provider events are listed separately. Older unrecorded sends cannot
          be reconstructed.
        </p>
      </div>
      {error ? (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 p-4 text-destructive"
        >
          {error}
        </div>
      ) : loading ? (
        <PanelLoader />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  {[
                    "Email",
                    "Category / provider",
                    "Status",
                    "Date (Dhaka)",
                  ].map((s) => (
                    <th key={s} className="px-4 py-3 font-medium">
                      {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {!data?.items.length ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-muted-foreground"
                    >
                      No matching emails.
                    </td>
                  </tr>
                ) : (
                  data.items.map((email) => (
                    <tr key={email.id} className="border-b last:border-0">
                      <td className="max-w-md px-4 py-4 align-top">
                        <p className="break-words font-medium">
                          {email.subject}
                        </p>
                        <p className="mt-1 break-all text-muted-foreground">
                          {email.recipient}
                        </p>
                        {email.messageId && (
                          <p className="mt-1 break-all text-xs text-muted-foreground">
                            ID: {email.messageId}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <p className="capitalize">
                          {email.category.replaceAll("_", " ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {email.provider}
                        </p>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex rounded-full border px-2.5 py-1 text-xs">
                          {email.status.replace("email.", "")}
                        </span>
                        {email.error && (
                          <p className="mt-2 max-w-xs break-words text-xs text-destructive">
                            {email.error}
                          </p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 align-top text-muted-foreground">
                        {date(email.sentAt || email.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground">
              {data?.total || 0} records · Page {page}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                disabled={!data || page * data.limit >= data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
