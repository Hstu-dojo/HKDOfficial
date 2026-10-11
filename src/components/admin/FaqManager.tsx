"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PanelLoader } from "@/components/loading";
import type { FaqTranslations } from "@/db/schemas/content/faqs";
type Form = {
  translations: FaqTranslations;
  displayOrder: number;
  isPublished: boolean;
};
type Faq = Form & { id: string; updatedAt: string };
const empty = (): Form => ({
  translations: {
    en: { question: "", answer: "" },
    bn: { question: "", answer: "" },
    ne: { question: "", answer: "" },
  },
  displayOrder: 0,
  isPublished: false,
});
export default function FaqManager() {
  const { hasPermission, loading: permissionsLoading } = useRBAC();
  const canRead = hasPermission("FAQ", "READ"),
    canCreate = hasPermission("FAQ", "CREATE"),
    canUpdate = hasPermission("FAQ", "UPDATE"),
    canDelete = hasPermission("FAQ", "DELETE");
  const [items, setItems] = useState<Faq[]>([]),
    [form, setForm] = useState<Form>(empty),
    [selected, setSelected] = useState<Faq | null>(null),
    [locale, setLocale] = useState<"en" | "bn" | "ne">("en"),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const canWrite = selected ? canUpdate : canCreate;
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/admin/faqs", { cache: "no-store" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to load FAQs");
      setItems(data.faqs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load FAQs");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!permissionsLoading && canRead) void load();
  }, [permissionsLoading, canRead, load]);
  function reset() {
    setSelected(null);
    setForm(empty());
    setLocale("en");
  }
  function edit(item: Faq) {
    setSelected(item);
    setForm({
      translations: structuredClone(item.translations),
      displayOrder: item.displayOrder,
      isPublished: item.isPublished,
    });
    setLocale("en");
    setError("");
    setMessage("");
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!canWrite || saving) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/admin/faqs", {
        method: selected ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(selected
            ? { id: selected.id, updatedAt: selected.updatedAt }
            : {}),
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to save FAQ");
      setItems((current) =>
        [...current.filter((i) => i.id !== data.faq.id), data.faq].sort(
          (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
        ),
      );
      reset();
      setMessage("FAQ saved. Published questions appear on the homepage.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save FAQ");
    } finally {
      setSaving(false);
    }
  }
  async function remove(item: Faq) {
    if (
      !canDelete ||
      saving ||
      !window.confirm(`Delete “${item.translations.en.question}”?`)
    )
      return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/admin/faqs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, updatedAt: item.updatedAt }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Unable to delete FAQ");
      setItems((current) => current.filter((i) => i.id !== item.id));
      if (selected?.id === item.id) reset();
      setMessage("FAQ deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete FAQ");
    } finally {
      setSaving(false);
    }
  }
  if (permissionsLoading) return <PanelLoader />;
  if (!canRead)
    return <p className="p-6">You do not have permission to view FAQs.</p>;
  const copy = form.translations[locale] || { question: "", answer: "" };
  return (
    <div className="portal-page space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Homepage FAQs</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage questions, translations and publication. Lower order numbers
            appear first.
          </p>
        </div>
        <Button
          variant="outline"
          disabled={loading || saving}
          onClick={() => void load()}
        >
          Reload
        </Button>
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {message && (
        <p
          role="status"
          className="rounded-xl border bg-secondary/10 p-4 text-sm"
        >
          {message}
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <section className="min-w-0 rounded-2xl border bg-card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Questions</h2>
          {loading ? (
            <PanelLoader />
          ) : items.length ? (
            <ul className="divide-y">
              {items.map((item) => (
                <li key={item.id} className="space-y-3 py-4 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 break-words font-medium">
                      {item.translations.en.question}
                    </p>
                    <span className="shrink-0 rounded-full border px-2 py-1 text-xs">
                      {item.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="line-clamp-2 whitespace-pre-line break-words text-sm text-muted-foreground">
                    {item.translations.en.answer}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mr-auto text-xs text-muted-foreground">
                      Order {item.displayOrder}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => edit(item)}
                    >
                      {canUpdate ? "Edit" : "View"}
                    </Button>
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => void remove(item)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">
              No FAQs yet. Add a question to get started.
            </p>
          )}
        </section>
        {(canCreate || selected) && (
          <form
            onSubmit={save}
            className="min-w-0 space-y-5 rounded-2xl border bg-card p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {selected ? "Edit question" : "New question"}
              </h2>
              {selected && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={saving}
                  onClick={reset}
                >
                  {canCreate ? "New question" : "Close"}
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              English is required. Missing translations use English. Answers are
              plain text.
            </p>
            <div
              className="flex flex-wrap gap-2"
              aria-label="Translation language"
            >
              {(["en", "bn", "ne"] as const).map((l) => (
                <Button
                  type="button"
                  key={l}
                  size="sm"
                  variant={locale === l ? "default" : "outline"}
                  aria-pressed={locale === l}
                  onClick={() => setLocale(l)}
                >
                  {l === "en" ? "English" : l === "bn" ? "বাংলা" : "नेपाली"}
                </Button>
              ))}
            </div>
            <fieldset disabled={!canWrite || saving} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="faq-question">Question</Label>
                <Input
                  id="faq-question"
                  value={copy.question}
                  maxLength={250}
                  required={locale === "en"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      translations: {
                        ...form.translations,
                        [locale]: { ...copy, question: e.target.value },
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-answer">Answer</Label>
                <Textarea
                  id="faq-answer"
                  value={copy.answer}
                  maxLength={4000}
                  rows={7}
                  required={locale === "en"}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      translations: {
                        ...form.translations,
                        [locale]: { ...copy, answer: e.target.value },
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faq-order">Display order</Label>
                <Input
                  id="faq-order"
                  className="max-w-32"
                  type="number"
                  min={0}
                  max={10000}
                  step={1}
                  required
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm({ ...form, displayOrder: e.target.valueAsNumber })
                  }
                />
              </div>
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) =>
                    setForm({ ...form, isPublished: e.target.checked })
                  }
                />
                Publish on the homepage
              </label>
              {canWrite && (
                <Button type="submit">
                  {saving ? "Saving…" : "Save question"}
                </Button>
              )}
            </fieldset>
          </form>
        )}
      </div>
    </div>
  );
}
