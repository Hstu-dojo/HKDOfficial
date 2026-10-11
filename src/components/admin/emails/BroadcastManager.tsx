"use client";
import { useContext, useEffect, useState } from "react";
import {
  Mail,
  Send,
  Paperclip,
  Eye,
  FileText,
  Plus,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { PanelLoader } from "@/components/loading";
import { AdminPermissionsContext } from "@/context/AdminPermissionsContext";
import type { BroadcastInput } from "@/lib/newsletter/model";
type Campaign = BroadcastInput & {
  id: string;
  status: string;
  noticeId: string | null;
  createdAt: string;
  sentAt: string | null;
  error: string | null;
  providerId: string | null;
};
type Result = {
  items: Campaign[];
  total: number;
  page: number;
  configured: boolean;
  stats: Array<{ status: string; count: number }>;
};
const blank: BroadcastInput = {
  subject: "",
  body: "",
  format: "markdown",
  attachments: [],
};
export default function BroadcastManager() {
  const permissions = useContext(AdminPermissionsContext);
  const can = (action: string) =>
    !!permissions?.permissions.some(
      (p) =>
        p.resource === "EMAIL" &&
        (p.action === action || p.action === "MANAGE"),
    );
  const [data, setData] = useState<Result | null>(null),
    [page, setPage] = useState(1),
    [refresh, setRefresh] = useState(0),
    [error, setError] = useState("");
  const [input, setInput] = useState<BroadcastInput>(blank),
    [editing, setEditing] = useState<string | null>(null),
    [preview, setPreview] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<Campaign | null>(null);
  useEffect(() => {
    const abort = new AbortController();
    setLoading(true);
    setError("");
    fetch(`/api/admin/newsletter?page=${page}`, { signal: abort.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw Error(result.error);
        if (!abort.signal.aborted) setData(result);
      })
      .catch((e) => {
        if (!abort.signal.aborted) setError(e.message);
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false);
      });
    return () => abort.abort();
  }, [page, refresh]);
  // Queue actions run after the response. Poll only while there is pending work.
  useEffect(() => {
    if (
      !data?.configured ||
      !data.items.some((i) =>
        ["queued", "creating", "sending"].includes(i.status),
      )
    )
      return;
    const timer = setTimeout(() => setRefresh((r) => r + 1), 8000);
    return () => clearTimeout(timer);
  }, [data]);
  async function request(method: string, body: unknown) {
    const response = await fetch("/api/admin/newsletter", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw Error(result.error || "Request failed");
    return result;
  }
  async function perform(operation: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    try {
      await operation();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }
  function edit(item: Campaign) {
    setEditing(item.id);
    setInput({
      subject: item.subject,
      body: item.body,
      format: item.format,
      attachments: item.attachments,
    });
    setPreview("");
    document
      .getElementById("broadcast-composer")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  const stat = (status: string) =>
    data?.stats.find((s) => s.status === status)?.count || 0;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            <Mail className="h-4 w-4 text-primary" />
            Academy newsletter
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">Broadcasts</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Publish academy updates and write custom newsletters. Notice
            publications are queued automatically; BKF feed refreshes do not
            send emails.
          </p>
        </div>
        <Button variant="outline" onClick={() => setRefresh((r) => r + 1)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 p-4 text-destructive"
        >
          {error}
        </p>
      )}
      {loading && !data ? (
        <PanelLoader />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ["Synced subscribers", stat("synced")],
              ["Waiting for sync", stat("pending")],
              ["Awaiting verification", stat("unverified")],
              ["Unsubscribed", stat("unsubscribed")],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border bg-card p-4">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">
                  {value}
                </p>
              </div>
            ))}
          </div>
          {!data?.configured && (
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-medium">Resend setup is pending</p>
              <p className="mt-1 text-muted-foreground">
                Subscriptions and notice campaigns are saved locally. Add the
                newsletter API key, segment ID and verified sender to enable
                sending. You can prepare drafts now.
              </p>
            </div>
          )}
          {(can("CREATE") || can("UPDATE")) && (
            <section
              id="broadcast-composer"
              className="scroll-mt-24 rounded-xl border bg-card p-4 sm:p-6"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <FileText className="h-5 w-5 text-primary" />
                  {editing ? "Edit draft" : "Write a newsletter"}
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    setEditing(null);
                    setInput(blank);
                    setPreview("");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New draft
                </Button>
              </div>
              <div className="grid min-w-0 gap-6 xl:grid-cols-2">
                <div className="min-w-0 space-y-4">
                  <label className="block text-sm font-medium">
                    Subject
                    <Input
                      className="mt-2"
                      value={input.subject}
                      maxLength={240}
                      onChange={(e) => {
                        setInput({ ...input, subject: e.target.value });
                        setPreview("");
                      }}
                      placeholder="An update from the dojo"
                    />
                  </label>
                  <label className="block text-sm font-medium">
                    Content format
                    <select
                      className="mt-2 block h-10 w-full rounded-md border bg-background px-3"
                      value={input.format}
                      onChange={(e) => {
                        setInput({
                          ...input,
                          format: e.target.value as BroadcastInput["format"],
                        });
                        setPreview("");
                      }}
                    >
                      <option value="markdown">Markdown</option>
                      <option value="html">HTML</option>
                    </select>
                  </label>
                  <label className="block text-sm font-medium">
                    Message
                    <Textarea
                      className="mt-2 min-h-[280px] font-mono text-sm"
                      value={input.body}
                      maxLength={60000}
                      onChange={(e) => {
                        setInput({ ...input, body: e.target.value });
                        setPreview("");
                      }}
                      placeholder={
                        input.format === "markdown"
                          ? "## Hello from Kaizen\n\nWrite your academy news here.\n\n[View our notices](https://www.hstuma.com/notice)"
                          : "<h2>Hello from Kaizen</h2>\n<p>Write your academy news here.</p>"
                      }
                    />
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Headings, lists, links and images are supported. The academy
                    header and unsubscribe footer are included automatically.
                    HTML is sanitized before preview and sending.
                  </p>
                  {input.attachments.length > 0 && (
                    <div className="space-y-2">
                      {input.attachments.map((id, i) => (
                        <div
                          key={id}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <span>Attachment {i + 1}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={busy}
                            onClick={() => {
                              setInput({
                                ...input,
                                attachments: input.attachments.filter(
                                  (a) => a !== id,
                                ),
                              });
                              setPreview("");
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  {can("CREATE") && (
                    <label
                      className={`inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${busy ? "pointer-events-none opacity-50" : ""}`}
                    >
                      <Paperclip className="h-4 w-4" />
                      Attach file
                      <input
                        type="file"
                        className="sr-only"
                        disabled={busy || input.attachments.length >= 8}
                        accept="application/pdf,image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          void perform(async () => {
                            const form = new FormData();
                            form.append("file", file);
                            const response = await fetch(
                              "/api/admin/newsletter/attachments",
                              { method: "POST", body: form },
                            );
                            const result = await response.json();
                            if (!response.ok) throw Error(result.error);
                            setInput((v) => ({
                              ...v,
                              attachments: [...v.attachments, result.id],
                            }));
                            setPreview("");
                            toast.success(`${result.name} attached`);
                          });
                        }}
                      />
                    </label>
                  )}
                  <p className="text-xs text-muted-foreground">
                    PDF or image, up to 4 MB. Files appear as Cloudflare
                    download links in the email.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      disabled={
                        busy ||
                        (!editing && !can("CREATE")) ||
                        (!!editing && !can("UPDATE"))
                      }
                      onClick={() =>
                        void perform(async () => {
                          const result = await request(
                            editing ? "PATCH" : "POST",
                            editing
                              ? { action: "edit", id: editing, input }
                              : input,
                          );
                          setEditing(result.item.id);
                          setRefresh((r) => r + 1);
                          toast.success("Draft saved");
                        })
                      }
                    >
                      {busy ? "Working…" : "Save draft"}
                    </Button>
                    <Button
                      variant="outline"
                      disabled={busy || !can("CREATE")}
                      onClick={() =>
                        void perform(async () =>
                          setPreview((await request("PUT", input)).html),
                        )
                      }
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                  </div>
                </div>
                <div className="min-w-0 rounded-lg border bg-muted/30">
                  <div className="border-b px-4 py-3 text-sm font-medium">
                    Email preview
                  </div>
                  {preview ? (
                    <iframe
                      title="Newsletter preview"
                      sandbox=""
                      srcDoc={preview}
                      className="h-[650px] w-full rounded-b-lg bg-white"
                    />
                  ) : (
                    <div className="flex min-h-[300px] items-center justify-center p-8 text-center text-sm text-muted-foreground">
                      Write your message, then preview the finished email.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
          <section className="overflow-hidden rounded-xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-6">
              <div>
                <h2 className="text-xl font-semibold">Campaign history</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Sent means Resend accepted the broadcast. Delivery events
                  appear in email history.
                </p>
              </div>
              {can("APPROVE") && (
                <Button
                  variant="outline"
                  disabled={busy || !data?.configured}
                  onClick={() =>
                    void perform(async () => {
                      await request("PATCH", { action: "process" });
                      toast.success("Pending work requested");
                      setRefresh((r) => r + 1);
                    })
                  }
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Process pending
                </Button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    {["Campaign", "Status", "Created", "Actions"].map((t) => (
                      <th key={t} className="px-4 py-3 font-medium">
                        {t}
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
                        No campaigns yet. Save a draft or publish an academy
                        notice.
                      </td>
                    </tr>
                  ) : (
                    data.items.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="min-w-[200px] max-w-md px-4 py-4">
                          <p className="font-medium">{item.subject}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {item.noticeId
                              ? "Notice publication"
                              : "Custom newsletter"}
                          </p>
                          {item.providerId && (
                            <p className="mt-1 break-all text-xs text-muted-foreground">
                              Resend ID: {item.providerId}
                            </p>
                          )}
                          {item.error && (
                            <p className="mt-2 text-xs text-destructive">
                              {item.error}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full border px-2.5 py-1 text-xs capitalize">
                            {item.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-muted-foreground">
                          {new Date(item.createdAt).toLocaleDateString(
                            "en-GB",
                            { timeZone: "Asia/Dhaka" },
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            {item.status === "draft" &&
                              !item.noticeId &&
                              can("UPDATE") && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy}
                                  onClick={() => edit(item)}
                                >
                                  Edit
                                </Button>
                              )}
                            {["draft", "failed"].includes(item.status) &&
                              (!item.noticeId || item.status === "failed") &&
                              can("APPROVE") && (
                                <Button
                                  size="sm"
                                  disabled={busy || !data.configured}
                                  onClick={() => setConfirmation(item)}
                                >
                                  <Send className="mr-2 h-3.5 w-3.5" />
                                  {item.status === "failed" ? "Retry" : "Send"}
                                </Button>
                              )}
                            {["draft", "queued", "failed"].includes(
                              item.status,
                            ) &&
                              can("UPDATE") && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  disabled={busy}
                                  onClick={() =>
                                    void perform(async () => {
                                      await request("PATCH", {
                                        action: "cancel",
                                        id: item.id,
                                      });
                                      setRefresh((r) => r + 1);
                                    })
                                  }
                                >
                                  Cancel
                                </Button>
                              )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4 text-sm">
              <p className="text-muted-foreground">
                {data?.total || 0} campaigns · Page {page}
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
                  disabled={!data || page * 20 >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          </section>
        </>
      )}
      <AlertDialog
        open={!!confirmation}
        onOpenChange={(open) => {
          if (!open && !busy) setConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this newsletter?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="mb-2 block break-words font-medium text-foreground">
                {confirmation?.subject}
              </span>
              This sends to the configured academy newsletter segment.
              Unsubscribed contacts are excluded by Resend. Sending cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirmation(null)}
            >
              Go back
            </Button>
            <Button
              disabled={busy}
              onClick={() =>
                void perform(async () => {
                  if (!confirmation) return;
                  await request("PATCH", {
                    action: "send",
                    id: confirmation.id,
                  });
                  setConfirmation(null);
                  setRefresh((r) => r + 1);
                  toast.success("Broadcast queued");
                })
              }
            >
              {busy ? "Queuing…" : "Send broadcast"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
