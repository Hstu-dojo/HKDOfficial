"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { attendanceRate, attendanceStatuses } from "@/lib/attendance/model";
type Student = { profileId: string; name: string; memberNumber: string };
type RecordRow = Student & { status: string; notes: string };
type Session = {
  id: string;
  date: string;
  label: string;
  notes: string;
  records: RecordRow[];
  updatedAt: string;
};
type Course = {
  id: string;
  name: string;
  organization: string;
  isActive: boolean;
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
async function api(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response
    .json()
    .catch(() => ({ error: "Service unavailable. Retry." }));
  if (!response.ok) throw Error(data.error);
  return data;
}
export default function AttendanceWorkspace({
  admin = false,
}: {
  admin?: boolean;
}) {
  const [courses, setCourses] = useState<Course[]>([]),
    [courseId, setCourseId] = useState(""),
    [date, setDate] = useState(today),
    [label, setLabel] = useState("Training"),
    [students, setStudents] = useState<Student[]>([]),
    [sessions, setSessions] = useState<Session[]>([]),
    [records, setRecords] = useState<RecordRow[]>([]),
    [notes, setNotes] = useState(""),
    [version, setVersion] = useState<string | null>(null),
    [canWrite, setCanWrite] = useState(false),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [search, setSearch] = useState(""),
    [dirty, setDirty] = useState(false),
    [reload, setReload] = useState(0);
  useEffect(() => {
    let stopped = false;
    api("/api/course-attendance")
      .then((data) => {
        if (stopped) return;
        setCourses(data.courses);
        setCourseId(
          data.courses.find((c: Course) => c.isActive)?.id ||
            data.courses[0]?.id ||
            "",
        );
        setCanWrite(data.canWrite);
      })
      .catch((e) => setError(e.message))
      .finally(() => {
        if (!stopped) setLoading(false);
      });
    return () => {
      stopped = true;
    };
  }, []);
  useEffect(() => {
    if (!courseId) return;
    const controller = new AbortController();
    setLoading(true);
    setStudents([]);
    setSessions([]);
    setError("");
    setMessage("");
    api(
      `/api/course-attendance?courseId=${encodeURIComponent(courseId)}&date=${date}`,
      { signal: controller.signal },
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setStudents(data.students);
        setSessions(data.sessions);
        setCanWrite(data.canWrite);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [courseId, date, reload]);
  useEffect(() => {
    const session = sessions.find((s) => s.date === date && s.label === label);
    const current = new Set(students.map((s) => s.profileId));
    setRecords([
      ...students.map((s) => ({
        ...s,
        status:
          session?.records.find((r) => r.profileId === s.profileId)?.status ||
          "unmarked",
        notes:
          session?.records.find((r) => r.profileId === s.profileId)?.notes ||
          "",
      })),
      ...(session?.records.filter((r) => !current.has(r.profileId)) || []),
    ]);
    setNotes(session?.notes || "");
    setVersion(session?.updatedAt || null);
    setDirty(false);
  }, [students, sessions, date, label]);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  function navigate(action: () => void) {
    if (!dirty || window.confirm("Discard unsaved attendance changes?"))
      action();
  }
  const active = new Set(students.map((s) => s.profileId));
  const visible = records.filter((r) =>
    `${r.name} ${r.memberNumber}`.toLowerCase().includes(search.toLowerCase()),
  );
  const monthly = useMemo(() => {
    const map = new Map<
      string,
      { student: Student; records: { status: string }[] }
    >();
    for (const session of sessions)
      for (const row of session.records) {
        if (!map.has(row.profileId))
          map.set(row.profileId, { student: row, records: [] });
        map.get(row.profileId)!.records.push(row);
      }
    return [...map.values()];
  }, [sessions]);
  async function save() {
    if (records.some((r) => r.status === "unmarked")) {
      setError("Mark each active student before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/course-attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          date,
          label,
          notes,
          updatedAt: version,
          records: records.map(({ profileId, status, notes }) => ({
            profileId,
            status,
            notes,
          })),
        }),
      });
      setSessions((previous) => [
        ...previous.filter((s) => s.id !== data.session.id),
        data.session,
      ]);
      setLabel(data.session.label);
      setDirty(false);
      setMessage("Attendance saved.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function csv() {
    const cell = (value: string) =>
      '"' +
      (/^\s*[=+@\-\t\r]/.test(value) ? "'" : "") +
      value.replaceAll('"', '""') +
      '"';
    const lines = [
      ["Date", "Session", "Student", "Member number", "Status", "Notes"],
      ...sessions.flatMap((s) =>
        s.records.map((r) => [
          s.date,
          s.label,
          r.name,
          r.memberNumber,
          r.status,
          r.notes,
        ]),
      ),
    ];
    const url = URL.createObjectURL(
      new Blob(
        ["\uFEFF" + lines.map((row) => row.map(cell).join(",")).join("\r\n")],
        { type: "text/csv;charset=utf-8" },
      ),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${date.slice(0, 7)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Course attendance</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {admin
              ? "Review training attendance across partner branches."
              : "Record attendance for your active enrolled students."}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={csv}
          disabled={!sessions.length || loading}
        >
          Export month CSV
        </Button>
      </div>
      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-300 p-4 text-sm text-red-600"
        >
          {error}{" "}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(() => setReload((r) => r + 1))}
          >
            Reload
          </Button>
        </div>
      )}
      {message && (
        <p role="status" className="text-sm text-emerald-600">
          {message}
        </p>
      )}
      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <label className="text-sm">
          Course
          <select
            className="mt-2 w-full rounded-md border bg-background p-2"
            value={courseId}
            disabled={busy || loading}
            onChange={(e) => navigate(() => setCourseId(e.target.value))}
          >
            {!courses.length && <option>No courses available</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {admin ? `${c.organization} — ` : ""}
                {c.name}
                {!c.isActive ? " (inactive)" : ""}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Training date
          <Input
            className="mt-2"
            type="date"
            max={today()}
            value={date}
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) navigate(() => setDate(e.target.value));
            }}
          />
        </label>
        <label className="text-sm">
          Session
          <Input
            className="mt-2"
            value={label}
            maxLength={80}
            disabled={busy}
            onChange={(e) => navigate(() => setLabel(e.target.value))}
            placeholder="Training / Morning / Evening"
          />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Sessions this month", sessions.length],
          [
            "Present / late",
            sessions.reduce(
              (n, s) =>
                n +
                s.records.filter((r) => ["present", "late"].includes(r.status))
                  .length,
              0,
            ),
          ],
          [
            "Absent",
            sessions.reduce(
              (n, s) =>
                n + s.records.filter((r) => r.status === "absent").length,
              0,
            ),
          ],
          [
            "Attendance rate",
            `${attendanceRate(sessions.flatMap((s) => s.records)) ?? "—"}%`,
          ],
        ].map(([title, value]) => (
          <div key={title} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="mt-2 text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>
      {loading ? (
        <div role="status" className="rounded-xl border p-8 text-sm">
          Loading register…
        </div>
      ) : !courseId ? (
        <p className="rounded-xl border p-8 text-sm text-muted-foreground">
          Create a branch course and enroll students to start taking attendance.
        </p>
      ) : (
        <>
          <section className="space-y-4 rounded-xl border bg-card p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">
                {date} · {label || "Choose a session"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {version ? "Saved register" : "New register"} ·{" "}
                {students.length} active students
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                className="w-full sm:max-w-xs"
                placeholder="Search name or member number"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={!canWrite || busy || !students.length}
                onClick={() => {
                  setRecords((rows) =>
                    rows.map((r) =>
                      active.has(r.profileId) ? { ...r, status: "present" } : r,
                    ),
                  );
                  setDirty(true);
                }}
              >
                Mark all present
              </Button>
            </div>
            {!records.length ? (
              <p className="py-8 text-sm text-muted-foreground">
                No active enrolled students for this course and date. Check
                enrollments and monthly activity status.
              </p>
            ) : (
              <div className="space-y-3">
                {visible.map((r) => (
                  <div
                    key={r.profileId}
                    className="grid items-center gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_160px_minmax(0,1fr)]"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium">
                        {r.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {r.memberNumber}
                        {!active.has(r.profileId) ? " · Historical entry" : ""}
                      </p>
                    </div>
                    <select
                      aria-label={`Attendance for ${r.name}`}
                      className="rounded-md border bg-background p-2 text-sm"
                      value={r.status}
                      disabled={!canWrite || busy || !active.has(r.profileId)}
                      onChange={(e) => {
                        setRecords((rows) =>
                          rows.map((row) =>
                            row.profileId === r.profileId
                              ? { ...row, status: e.target.value }
                              : row,
                          ),
                        );
                        setDirty(true);
                      }}
                    >
                      <option value="unmarked">Not marked</option>
                      {attendanceStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status[0].toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    <Input
                      aria-label={`Notes for ${r.name}`}
                      placeholder="Optional note"
                      maxLength={300}
                      value={r.notes}
                      disabled={!canWrite || busy || !active.has(r.profileId)}
                      onChange={(e) => {
                        setRecords((rows) =>
                          rows.map((row) =>
                            row.profileId === r.profileId
                              ? { ...row, notes: e.target.value }
                              : row,
                          ),
                        );
                        setDirty(true);
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            <label className="block text-sm">
              Session notes
              <textarea
                className="mt-2 min-h-20 w-full rounded-md border bg-background p-3"
                value={notes}
                maxLength={1000}
                disabled={!canWrite || busy}
                onChange={(e) => {
                  setNotes(e.target.value);
                  setDirty(true);
                }}
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                Late counts as attended. Excused absences are excluded from the
                attendance rate.
              </p>
              <Button
                disabled={!canWrite || busy || !records.length || !label.trim()}
                onClick={save}
              >
                {busy ? "Saving…" : "Save attendance"}
              </Button>
            </div>
          </section>
          <section className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold">
              Session history · {date.slice(0, 7)}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {sessions.map((s) => (
                <Button
                  key={s.id}
                  variant="outline"
                  onClick={() =>
                    navigate(() => {
                      setDate(s.date);
                      setLabel(s.label);
                    })
                  }
                >
                  {s.date} · {s.label}
                </Button>
              ))}
              {!sessions.length && (
                <p className="text-sm text-muted-foreground">
                  No saved sessions this month.
                </p>
              )}
            </div>
          </section>
          <section className="rounded-xl border bg-card p-4 sm:p-6">
            <h2 className="text-lg font-semibold">Monthly student summary</h2>
            <div className="mt-4 space-y-3">
              {monthly.map(({ student, records }) => (
                <div
                  key={student.profileId}
                  className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 text-sm"
                >
                  <div>
                    {student.name}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {student.memberNumber}
                    </span>
                  </div>
                  <span>
                    {
                      records.filter(
                        (r) => r.status === "present" || r.status === "late",
                      ).length
                    }{" "}
                    attended ·{" "}
                    {records.filter((r) => r.status === "absent").length} absent
                    · {attendanceRate(records) ?? "—"}%
                  </span>
                </div>
              ))}
              {!monthly.length && (
                <p className="text-sm text-muted-foreground">
                  Save a register to see student attendance totals.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
