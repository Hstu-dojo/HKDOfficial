"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PublicCompetitionResult } from "@/lib/competition-results";

type Result = PublicCompetitionResult & { isPublished: boolean };
type Athlete = {
  id: string;
  name: string | null;
  nameBangla: string | null;
  memberNumber: string;
};
const emptyForm = {
  profileId: "",
  eventName: "",
  eventDate: "",
  category: "",
  placement: 1,
  isPublished: false,
};

export default function CompetitionResultsManager() {
  const t = useScopedI18n("competition");
  const locale = useCurrentLocale();
  const { hasPermission, loading: permissionsLoading } = useRBAC();
  const canRead = hasPermission("EVENT", "READ");
  const [results, setResults] = useState<Result[]>([]);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [athleteSearch, setAthleteSearch] = useState("");
  const [search, setSearch] = useState("");
  const canWrite = hasPermission("EVENT", editingId ? "UPDATE" : "CREATE");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/competition-results", {
        cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t("loadError"));
      setResults(data.results);
      setAthletes(data.athletes);
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);
  useEffect(() => {
    if (canRead) void load();
  }, [canRead, load]);

  function reset() {
    setEditingId(null);
    setForm(emptyForm);
    setAthleteSearch("");
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!canWrite || busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/competition-results", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          ...(editingId ? { id: editingId } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      reset();
      setMessage(t("saved"));
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : t("loadError"));
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    if (
      !hasPermission("EVENT", "DELETE") ||
      busy ||
      !window.confirm(t("deleteConfirm"))
    )
      return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(
        `/api/admin/competition-results?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (editingId === id) reset();
      setMessage(t("deleted"));
      await load();
    } catch (error) {
      setError(error instanceof Error ? error.message : t("loadError"));
    } finally {
      setBusy(false);
    }
  }
  if (permissionsLoading) return <p>{t("loading")}</p>;
  if (!canRead) return <p>{t("accessDenied")}</p>;
  const filteredAthletes = athletes.filter(
    (a) =>
      a.id === form.profileId ||
      `${a.name} ${a.nameBangla} ${a.memberNumber}`
        .toLowerCase()
        .includes(athleteSearch.toLowerCase()),
  );
  const filteredResults = results.filter((r) =>
    `${r.eventName} ${r.category} ${r.athleteName} ${r.athleteNameBangla}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl">{t("adminTitle")}</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          {t("adminDescription")}
        </p>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 p-4 text-destructive"
        >
          {error}{" "}
          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={busy}
            className="ml-3"
          >
            {t("retry")}
          </Button>
        </div>
      )}
      {message && (
        <p role="status" className="text-primary">
          {message}
        </p>
      )}
      {canWrite && (
        <form
          onSubmit={save}
          className="rounded-xl border border-border bg-card p-5 md:p-7"
        >
          <h2 className="mb-6 text-xl">
            {editingId ? t("editResult") : t("newResult")}
          </h2>
          <fieldset disabled={busy || loading} className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="result-athlete-search" className="text-sm">
                  {t("athleteSearch")}
                </label>
                <Input
                  id="result-athlete-search"
                  value={athleteSearch}
                  onChange={(e) => setAthleteSearch(e.target.value)}
                />
                <label htmlFor="result-athlete" className="block text-sm">
                  {t("athlete")}
                </label>
                <select
                  id="result-athlete"
                  required
                  className="h-11 w-full rounded-md border border-input bg-background px-3 text-foreground"
                  value={form.profileId}
                  onChange={(e) =>
                    setForm({ ...form, profileId: e.target.value })
                  }
                >
                  <option value="">{t("selectAthlete")}</option>
                  {filteredAthletes.map((athlete) => (
                    <option key={athlete.id} value={athlete.id}>
                      {(locale === "bn"
                        ? athlete.nameBangla || athlete.name
                        : athlete.name || athlete.nameBangla) || "—"}{" "}
                      · {athlete.memberNumber}
                    </option>
                  ))}
                </select>
                {!loading && !athletes.length && (
                  <p className="text-sm text-muted-foreground">
                    {t("noAthletes")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label htmlFor="result-event" className="text-sm">
                  {t("event")}
                </label>
                <Input
                  id="result-event"
                  required
                  minLength={2}
                  maxLength={200}
                  value={form.eventName}
                  onChange={(e) =>
                    setForm({ ...form, eventName: e.target.value })
                  }
                />
                <label htmlFor="result-date" className="block text-sm">
                  {t("date")}
                </label>
                <Input
                  id="result-date"
                  type="date"
                  required
                  value={form.eventDate}
                  onChange={(e) =>
                    setForm({ ...form, eventDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="result-category" className="text-sm">
                  {t("category")}
                </label>
                <Input
                  id="result-category"
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="result-placement" className="text-sm">
                  {t("placement")}
                </label>
                <Input
                  id="result-placement"
                  type="number"
                  required
                  min={1}
                  max={128}
                  step={1}
                  value={Number.isNaN(form.placement) ? "" : form.placement}
                  onChange={(e) =>
                    setForm({ ...form, placement: e.target.valueAsNumber })
                  }
                  aria-describedby="result-placement-help"
                />
                <p
                  id="result-placement-help"
                  className="text-xs text-muted-foreground"
                >
                  {t("placementHelp")}
                </p>
              </div>
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) =>
                  setForm({ ...form, isPublished: e.target.checked })
                }
                className="h-4 w-4 accent-primary"
              />
              {t("publish")}
            </label>
            <div className="flex gap-3">
              <Button type="submit" disabled={!athletes.length}>
                {busy ? t("saving") : t("save")}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={reset}>
                  {t("cancel")}
                </Button>
              )}
            </div>
          </fieldset>
        </form>
      )}
      <div className="rounded-xl border border-border bg-card p-5">
        <label htmlFor="result-search" className="mb-2 block text-sm">
          {t("search")}
        </label>
        <Input
          id="result-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-5 max-w-md"
        />
        {loading ? (
          <p role="status">{t("loading")}</p>
        ) : !filteredResults.length ? (
          <p className="text-muted-foreground">{t("noResults")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead>
                <tr>
                  {[
                    t("event"),
                    t("athlete"),
                    t("category"),
                    t("placement"),
                    t("status"),
                    t("actions"),
                  ].map((label) => (
                    <th
                      scope="col"
                      key={label}
                      className="border-b border-border p-3 font-medium"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredResults.map((result) => (
                  <tr key={result.id} className="border-b border-border/60">
                    <td className="p-3">
                      {result.eventName}
                      <span className="block text-xs text-muted-foreground">
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeZone: "UTC",
                        }).format(new Date(`${result.eventDate}T00:00:00Z`))}
                      </span>
                    </td>
                    <td className="p-3">
                      {locale === "bn"
                        ? result.athleteNameBangla || result.athleteName
                        : result.athleteName || result.athleteNameBangla}
                    </td>
                    <td className="p-3">{result.category}</td>
                    <td className="p-3">
                      {new Intl.NumberFormat(locale).format(result.placement)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs ${result.isPublished ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {result.isPublished ? t("published") : t("draft")}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {hasPermission("EVENT", "UPDATE") && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy}
                            onClick={() => {
                              setEditingId(result.id);
                              setForm({
                                profileId: result.profileId,
                                eventName: result.eventName,
                                eventDate: result.eventDate,
                                category: result.category,
                                placement: result.placement,
                                isPublished: result.isPublished,
                              });
                              setAthleteSearch("");
                              setMessage("");
                            }}
                          >
                            {t("edit")}
                          </Button>
                        )}
                        {hasPermission("EVENT", "DELETE") && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={busy}
                            onClick={() => void remove(result.id)}
                          >
                            {t("delete")}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
