"use client";
import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiJSON } from "@/app/(partner-portal)/partner-admin/(portal)/_lib/api.client";
import { createAttendanceHook } from "@partner-shared/controller";
import {
  attendanceRate,
  attendanceStatuses,
  attendanceCSV,
  attendanceCopy,
  businessDate as today,
} from "@partner-shared/attendance";
import type { AttendanceStatus, Client } from "@partner-shared/types";
import AttendanceSummary from "./AttendanceSummary";
const useAttendance = createAttendanceHook(React);
const api: Client = (path, body) =>
  apiJSON(
    path,
    body === undefined
      ? undefined
      : { method: "POST", body: JSON.stringify(body) },
  );
export default function AttendanceWorkspace({
  admin = false,
}: {
  admin?: boolean;
}) {
  const {
    courses,
    courseId,
    setCourseId,
    date,
    setDate,
    label,
    setLabel,
    students,
    sessions,
    records,
    notes,
    setNotes,
    version,
    canWrite,
    busy,
    loading,
    error,
    message,
    search,
    setSearch,
    dirty,
    active,
    visible,
    monthly,
    mark,
    markAllPresent,
    setStudentNote,
    save,
    retry,
  } = useAttendance(api);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  function navigate(action: () => void) {
    if (!dirty || window.confirm("Discard unsaved attendance changes?"))
      action();
  }
  function csv() {
    const url = URL.createObjectURL(
      new Blob([attendanceCSV(sessions)], { type: "text/csv;charset=utf-8" }),
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
          <h1 className="text-2xl font-semibold">{attendanceCopy.title}</h1>
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
          <Button variant="outline" size="sm" onClick={() => navigate(retry)}>
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
      <AttendanceSummary sessions={sessions} />
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
                placeholder={attendanceCopy.search}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button
                variant="outline"
                disabled={!canWrite || busy || !students.length}
                onClick={markAllPresent}
              >
                {attendanceCopy.bulk}
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
                      onChange={(e) =>
                        mark(r.profileId, e.target.value as AttendanceStatus)
                      }
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
                      onChange={(e) =>
                        setStudentNote(r.profileId, e.target.value)
                      }
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
                onChange={(e) => setNotes(e.target.value)}
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {attendanceCopy.rateHelp}
              </p>
              <Button
                disabled={!canWrite || busy || !records.length || !label.trim()}
                onClick={save}
              >
                {busy ? "Saving…" : attendanceCopy.save}
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
