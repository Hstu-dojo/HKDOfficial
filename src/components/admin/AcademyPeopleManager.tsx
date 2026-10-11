"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PanelLoader } from "@/components/loading";
import type {
  PersonCopy,
  PersonTranslations,
} from "@/db/schemas/content/academy-people";
type Form = {
  kind: "sensei" | "instructor" | "black_belt";
  translations: PersonTranslations;
  photoUrl: string;
  profileUrl: string;
  bkfRegistrationNo: string;
  blackBeltNo: string;
  displayOrder: number;
  isPublished: boolean;
};
type Person = Form & { id: string };
const blankCopy = (): PersonCopy => ({
  name: "",
  title: "",
  rank: "",
  summary: "",
  biography: "",
});
const empty = (): Form => ({
  kind: "sensei",
  translations: { en: blankCopy(), bn: blankCopy(), ne: blankCopy() },
  photoUrl: "",
  profileUrl: "",
  bkfRegistrationNo: "",
  blackBeltNo: "",
  displayOrder: 0,
  isPublished: false,
});
const kindLabels = {
  sensei: "Featured sensei",
  instructor: "Instructor",
  black_belt: "Black belt / senior member",
};
export default function AcademyPeopleManager() {
  const { hasPermission, loading: permissionsLoading } = useRBAC();
  const canRead = hasPermission("INSTRUCTOR", "READ"),
    canCreate = hasPermission("INSTRUCTOR", "CREATE"),
    canUpdate = hasPermission("INSTRUCTOR", "UPDATE"),
    canDelete = hasPermission("INSTRUCTOR", "DELETE");
  const [people, setPeople] = useState<Person[]>([]),
    [form, setForm] = useState<Form>(empty),
    [id, setId] = useState<string | null>(null),
    [locale, setLocale] = useState<"en" | "bn" | "ne">("en");
  const [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const canWrite = id ? canUpdate : canCreate;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/instructors");
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to load profiles");
      setPeople(result.people);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load profiles");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    if (!permissionsLoading && canRead) void load();
  }, [permissionsLoading, canRead, load]);
  function edit(person: Person) {
    setId(person.id);
    setForm({ ...person, translations: structuredClone(person.translations) });
    setLocale("en");
    setError("");
    setMessage("");
  }
  function create() {
    setId(null);
    setForm({
      ...empty(),
      kind: people.some((p) => p.kind === "sensei") ? "instructor" : "sensei",
    });
    setLocale("en");
    setError("");
    setMessage("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!canWrite) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/instructors", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ...(id ? { id } : {}) }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to save profile");
      setId(result.person.id);
      setForm(result.person);
      await load();
      setMessage("Profile saved. Published changes appear on the homepage.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  }
  async function remove(person: Person) {
    if (
      !canDelete ||
      !window.confirm(
        `Delete ${person.translations.en.name} from the academy team?`,
      )
    )
      return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/instructors?id=${encodeURIComponent(person.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to delete profile");
      if (id === person.id) create();
      await load();
      setMessage("Profile deleted.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to delete profile");
    } finally {
      setSaving(false);
    }
  }
  function field(key: keyof PersonCopy, value: string) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [locale]: {
          ...blankCopy(),
          ...current.translations[locale],
          [key]: value,
        },
      },
    }));
  }
  if (permissionsLoading) return <PanelLoader />;
  if (!canRead)
    return (
      <p className="text-sm text-destructive">
        You do not have permission to view academy profiles.
      </p>
    );
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Sensei & Team
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Edit the featured sensei’s biography and short instructor and
            black-belt profiles. Only published entries appear on the homepage.
          </p>
        </div>
        {canCreate && (
          <Button disabled={saving} onClick={create}>
            New profile
          </Button>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="text-sm text-primary">
          {message}
        </p>
      )}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="rounded-xl border bg-card p-5">
          <h2 className="mb-4 font-semibold">Academy profiles</h2>
          {loading ? (
            <PanelLoader />
          ) : !people.length ? (
            <p className="text-sm text-muted-foreground">
              No profiles yet. Add your sensei first, then instructors and black
              belts.
            </p>
          ) : (
            <div className="space-y-3">
              {people.map((person) => (
                <article key={person.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="break-words font-medium">
                        {person.translations.en.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {kindLabels[person.kind]} · Order {person.displayOrder}
                      </p>
                    </div>
                    <span className="rounded-full border px-2 py-1 text-xs">
                      {person.isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {person.translations.en.title}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving}
                      onClick={() => edit(person)}
                    >
                      {canUpdate ? "Edit" : "View"}
                    </Button>
                    {canDelete && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        disabled={saving}
                        onClick={() => void remove(person)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <form
          onSubmit={save}
          className="min-w-0 space-y-5 rounded-xl border bg-card p-5"
        >
          <h2 className="font-semibold">
            {id ? "Edit profile" : "New profile"}
          </h2>
          <fieldset
            disabled={saving || !canWrite}
            className="min-w-0 space-y-5 disabled:opacity-70"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="person-kind">Profile type</Label>
                <select
                  id="person-kind"
                  value={form.kind}
                  onChange={(e) =>
                    setForm({ ...form, kind: e.target.value as Form["kind"] })
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  {Object.entries(kindLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="person-order">Display order</Label>
                <Input
                  id="person-order"
                  type="number"
                  min={0}
                  max={9999}
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm({ ...form, displayOrder: Number(e.target.value) })
                  }
                />
              </div>
            </div>
            <fieldset className="space-y-3 rounded-xl border p-4">
              <legend className="px-2 text-sm font-medium">
                BKF black belt credentials
              </legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="person-bkf">BKF registration number</Label>
                  <Input
                    id="person-bkf"
                    value={form.bkfRegistrationNo}
                    maxLength={13}
                    placeholder="BKF018642"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        bkfRegistrationNo: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="person-belt">Black belt number</Label>
                  <Input
                    id="person-belt"
                    value={form.blackBeltNo}
                    maxLength={11}
                    placeholder="D03135"
                    onChange={(e) =>
                      setForm({
                        ...form,
                        blackBeltNo: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional. Published credentials appear on the homepage with a
                link to the official BKF DAN Holder List. Leave blank for
                credentials issued by other federations.
              </p>
              <a
                href="https://bkf.gov.bd/dan-registrations-index"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex text-sm text-primary"
              >
                Check the BKF list ↗
              </a>
            </fieldset>
            <div className="space-y-2">
              <Label htmlFor="person-photo">Portrait image URL</Label>
              <Input
                id="person-photo"
                value={form.photoUrl}
                maxLength={2000}
                placeholder="https://… or /image/portrait.jpg"
                onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Upload a portrait in Gallery and copy its public image URL here.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="person-profile">Profile link (optional)</Label>
              <Input
                id="person-profile"
                type="url"
                maxLength={2000}
                value={form.profileUrl}
                placeholder="https://www.facebook.com/…"
                onChange={(e) =>
                  setForm({ ...form, profileUrl: e.target.value })
                }
              />
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2" aria-label="Profile language">
            {(["en", "bn", "ne"] as const).map((language) => (
              <Button
                key={language}
                type="button"
                size="sm"
                variant={locale === language ? "default" : "outline"}
                aria-pressed={locale === language}
                onClick={() => setLocale(language)}
              >
                {{ en: "English", bn: "বাংলা", ne: "नेपाली" }[language]}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            English is required. Empty Bangla or Nepali fields fall back to
            English.
          </p>
          <fieldset
            disabled={saving || !canWrite}
            className="min-w-0 space-y-4 disabled:opacity-70"
          >
            {(["name", "title", "rank"] as const).map((key) => (
              <div className="space-y-2" key={key}>
                <Label htmlFor={`person-${key}`}>
                  {
                    {
                      name: "Name",
                      title: "Title / role",
                      rank: "Belt / rank (optional)",
                    }[key]
                  }
                </Label>
                <Input
                  id={`person-${key}`}
                  maxLength={key === "rank" ? 100 : 150}
                  required={locale === "en" && key !== "rank"}
                  value={form.translations[locale]?.[key] || ""}
                  onChange={(e) => field(key, e.target.value)}
                />
              </div>
            ))}
            <div className="space-y-2">
              <Label htmlFor="person-summary">Short profile</Label>
              <textarea
                id="person-summary"
                rows={3}
                maxLength={600}
                value={form.translations[locale]?.summary || ""}
                onChange={(e) => field("summary", e.target.value)}
                className="w-full rounded-md border bg-background p-3 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Shown on instructor and black-belt cards; optional introduction
                for the sensei.
              </p>
            </div>
            {form.kind === "sensei" && (
              <div className="space-y-2">
                <Label htmlFor="person-biography">Sensei biography</Label>
                <textarea
                  id="person-biography"
                  rows={9}
                  maxLength={12000}
                  value={form.translations[locale]?.biography || ""}
                  onChange={(e) => field("biography", e.target.value)}
                  className="w-full rounded-md border bg-background p-3 text-sm"
                />
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm({ ...form, isPublished: e.target.checked })
                }
              />
              Publish on homepage
            </label>
            <p className="text-xs text-muted-foreground">
              Only one featured sensei can be published. Unpublish the previous
              sensei before replacing them.
            </p>
            {canWrite && (
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save profile"}
              </Button>
            )}
          </fieldset>
        </form>
      </div>
    </div>
  );
}
