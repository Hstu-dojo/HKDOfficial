"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PanelLoader } from "@/components/loading";
import {
  categories,
  dhakaInput,
  dhakaISO,
  isNoticeExpired,
  noticeDate,
  noticeHref,
  noticeSchema,
} from "@/lib/notices/model";
import type { NoticeInput } from "@/lib/notices/model";
type Row = NoticeInput & { id: string; updatedAt: string };
const blank = (): NoticeInput => ({
  title: "",
  content: "",
  category: "general",
  priority: 0,
  isPinned: false,
  isPublished: false,
  isArchived: false,
  publishedAt: null,
  expiresAt: null,
  attachmentUrl: "",
  translations: {
    bn: { title: "", content: "" },
    ne: { title: "", content: "" },
  },
});
export default function NoticeManager() {
  const { hasPermission, loading: permissionsLoading } = useRBAC(),
    canRead = hasPermission("ANNOUNCEMENT", "READ"),
    canCreate = hasPermission("ANNOUNCEMENT", "CREATE"),
    canUpdate = hasPermission("ANNOUNCEMENT", "UPDATE"),
    canDelete = hasPermission("ANNOUNCEMENT", "DELETE");
  const [rows, setRows] = useState<Row[]>([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [form, setForm] = useState<NoticeInput | null>(null),
    [id, setId] = useState<string | null>(null),
    [locale, setLocale] = useState<"en" | "bn" | "ne">("en"),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(1),
    [total, setTotal] = useState(0),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    if (permissionsLoading || !canRead) return;
    const controller = new AbortController();
    const timer = setTimeout(
      async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `/api/admin/announcements?${new URLSearchParams({ page: String(page), status: filter, search })}`,
            { signal: controller.signal, cache: "no-store" },
          );
          const data = await res.json();
          if (!res.ok) throw Error(data.error || "Unable to load notices");
          setRows(data.items);
          setTotal(data.total);
          setError("");
        } catch (e) {
          if (!controller.signal.aborted)
            setError(e instanceof Error ? e.message : "Unable to load notices");
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      },
      search ? 250 : 0,
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [permissionsLoading, canRead, page, filter, search, revision]);
  const update = <K extends keyof NoticeInput>(key: K, value: NoticeInput[K]) =>
    setForm((current) => (current ? { ...current, [key]: value } : current));
  const edit = (row?: Row) => {
    setId(row?.id || null);
    setLocale("en");
    setMessage("");
    setError("");
    setForm(
      row
        ? {
            ...blank(),
            title: row.title,
            content: row.content,
            category: row.category,
            priority: Math.min(row.priority, 2),
            isPinned: row.isPinned,
            isPublished: row.isPublished,
            isArchived: row.isArchived,
            publishedAt: row.publishedAt,
            expiresAt: row.expiresAt,
            attachmentUrl: row.attachmentUrl,
            translations: {
              bn: { title: "", content: "", ...row.translations.bn },
              ne: { title: "", content: "", ...row.translations.ne },
            },
          }
        : blank(),
    );
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      const values = noticeSchema.parse(form);
      const res = await fetch("/api/admin/announcements", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...(id ? { id } : {}) }),
      });
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Unable to save notice");
      setForm(null);
      setId(null);
      setMessage(
        "Notice saved. Published notices update the public notice board.",
      );
      setRevision((r) => r + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save notice");
    } finally {
      setSaving(false);
    }
  };
  const remove = async (row: Row) => {
    if (
      !window.confirm(
        `Permanently delete “${row.title}”? Archive it instead to retain its history.`,
      )
    )
      return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/announcements?id=${encodeURIComponent(row.id)}`,
        { method: "DELETE" },
      );
      const data = await res.json();
      if (!res.ok) throw Error(data.error || "Unable to delete notice");
      if (id === row.id) {
        setForm(null);
        setId(null);
      }
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else setRevision((r) => r + 1);
      setMessage("Notice deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete notice");
    } finally {
      setSaving(false);
    }
  };
  if (permissionsLoading)
    return <PanelLoader title="Loading notice permissions" />;
  if (!canRead) return <p>You do not have permission to view announcements.</p>;
  const text =
    locale === "en"
      ? { title: form?.title || "", content: form?.content || "" }
      : form?.translations[locale] || { title: "", content: "" };
  const setCopy = (key: "title" | "content", value: string) => {
    if (!form) return;
    if (locale === "en") update(key, value);
    else
      update("translations", {
        ...form.translations,
        [locale]: { ...text, [key]: value },
      });
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Notice board
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage academy announcements. Federation notices are synced
            separately from BKF.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href="/notice" target="_blank" rel="noopener noreferrer">
              View public board ↗
            </a>
          </Button>
          {canCreate && (
            <Button onClick={() => edit()} disabled={saving}>
              New notice
            </Button>
          )}
        </div>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setRevision((r) => r + 1)}
          >
            Retry loading
          </button>
        </div>
      )}
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      {form && (
        <form onSubmit={save} className="portal-surface space-y-6">
          <fieldset disabled={saving} className="min-w-0 space-y-6">
            <div className="flex justify-between gap-4">
              <h2 className="text-xl font-semibold">
                {id ? "Edit notice" : "New academy notice"}
              </h2>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForm(null)}
              >
                Cancel
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["en", "bn", "ne"] as const).map((l) => (
                <Button
                  key={l}
                  type="button"
                  variant={locale === l ? "default" : "outline"}
                  onClick={() => setLocale(l)}
                  aria-pressed={locale === l}
                >
                  {l === "en" ? "English" : l === "bn" ? "বাংলা" : "नेपाली"}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              English is required. Missing translated fields fall back to
              English. Text supports Markdown; HTML is not rendered.
            </p>
            <div className="space-y-2">
              <Label htmlFor="notice-title">
                Title {locale === "en" ? "*" : ""}
              </Label>
              <Input
                id="notice-title"
                maxLength={240}
                value={text.title}
                onChange={(e) => setCopy("title", e.target.value)}
                required={locale === "en"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-content">
                Notice text {locale === "en" ? "*" : ""}
              </Label>
              <Textarea
                id="notice-content"
                rows={8}
                maxLength={16000}
                value={text.content}
                onChange={(e) => setCopy("content", e.target.value)}
                required={locale === "en"}
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="notice-category">Category</Label>
                <select
                  id="notice-category"
                  className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.category}
                  onChange={(e) =>
                    update(
                      "category",
                      e.target.value as NoticeInput["category"],
                    )
                  }
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notice-priority">Priority</Label>
                <select
                  id="notice-priority"
                  className="min-h-11 w-full rounded-md border bg-background px-3 text-sm"
                  value={form.priority}
                  onChange={(e) => update("priority", Number(e.target.value))}
                >
                  {["Normal", "Important", "Urgent"].map((label, i) => (
                    <option key={i} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notice-publication">
                  Publish at (Bangladesh time)
                </Label>
                <Input
                  id="notice-publication"
                  type="datetime-local"
                  value={dhakaInput(form.publishedAt)}
                  onChange={(e) =>
                    update("publishedAt", dhakaISO(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to publish immediately when Published is enabled.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notice-expiry">
                  Expires at (Bangladesh time)
                </Label>
                <Input
                  id="notice-expiry"
                  type="datetime-local"
                  value={dhakaInput(form.expiresAt)}
                  onChange={(e) =>
                    update("expiresAt", dhakaISO(e.target.value))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Expired notices move to Past notices, and leave the homepage.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notice-attachment">
                Attachment URL (optional)
              </Label>
              <Input
                id="notice-attachment"
                value={form.attachmentUrl}
                onChange={(e) => update("attachmentUrl", e.target.value)}
                placeholder="https://… or /documents/notice.pdf"
              />
            </div>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPinned}
                  onChange={(e) => update("isPinned", e.target.checked)}
                />
                Pin to top
              </label>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => {
                    update("isPublished", e.target.checked);
                    if (e.target.checked) update("isArchived", false);
                  }}
                />
                Published
              </label>
              <label className="flex min-h-11 items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isArchived}
                  onChange={(e) => {
                    update("isArchived", e.target.checked);
                    if (e.target.checked) update("isPublished", false);
                  }}
                />
                Archived (hidden from public)
              </label>
            </div>
            <Button
              type="submit"
              disabled={saving || !(id ? canUpdate : canCreate)}
            >
              {saving ? "Saving…" : id ? "Save changes" : "Create notice"}
            </Button>
          </fieldset>
        </form>
      )}
      <section className="portal-surface space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">
            Academy notices{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({total})
            </span>
          </h2>
          <div className="flex min-w-0 flex-wrap gap-2">
            <Input
              aria-label="Search academy notices"
              className="w-full sm:w-64"
              value={search}
              placeholder="Search notices…"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
            <select
              aria-label="Filter publication status"
              className="min-h-10 rounded-md border bg-background px-3 text-sm"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
            >
              {["all", "draft", "published", "archived"].map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {loading ? (
          <PanelLoader title="Loading notices" />
        ) : rows.length ? (
          <div className="divide-y">
            {rows.map((row) => {
              const status = row.isArchived
                ? "Archived"
                : !row.isPublished
                  ? "Draft"
                  : row.publishedAt && new Date(row.publishedAt) > new Date()
                    ? "Scheduled"
                    : isNoticeExpired(row)
                      ? "Expired"
                      : "Published";
              return (
                <article
                  key={row.id}
                  className="flex flex-col justify-between gap-4 py-5 sm:flex-row"
                >
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full border px-2 py-1">
                        {status}
                      </span>
                      <span className="py-1 capitalize">{row.category}</span>
                      {row.isPinned && (
                        <span className="py-1 text-primary">Pinned</span>
                      )}
                    </div>
                    <h3 className="break-words font-medium">{row.title}</h3>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Updated {noticeDate(row.updatedAt)}
                      {row.publishedAt
                        ? ` · Publish ${noticeDate(row.publishedAt)}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {row.isPublished &&
                      !row.isArchived &&
                      (!row.publishedAt ||
                        new Date(row.publishedAt) <= new Date()) && (
                        <Button asChild variant="ghost" size="sm">
                          <a
                            href={noticeHref(row.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View ↗
                          </a>
                        </Button>
                      )}
                    {canUpdate && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => edit(row)}
                      >
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving}
                        onClick={() => remove(row)}
                        className="text-destructive"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {search || filter !== "all"
              ? "No matching notices."
              : "No academy notices yet. Create a draft to get started."}
          </p>
        )}
        <div className="flex items-center justify-between border-t pt-4 text-sm">
          <span>
            Page {page} of {Math.max(1, Math.ceil(total / 25))}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={loading || page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={loading || page * 25 >= total}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </section>
      <aside className="portal-surface text-sm text-muted-foreground">
        <h2 className="mb-2 font-semibold text-foreground">
          Federation notices
        </h2>
        <p>
          BKF notices are read-only, labeled separately, and refreshed every 30
          minutes when the board is visited. The last successful snapshot is
          retained during outages.
        </p>
        <a
          className="mt-3 inline-flex min-h-10 items-center text-primary"
          href="https://bkf.gov.bd/all-notice"
          target="_blank"
          rel="noopener noreferrer"
        >
          View original BKF notice board ↗
        </a>
      </aside>
    </div>
  );
}
