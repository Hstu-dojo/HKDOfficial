"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { apiJSON } from "@/app/(partner-portal)/partner-admin/(portal)/_lib/api.client";
import { createAttendanceHook } from "@partner-shared/controller";
import {
  attendanceRate,
  attendanceStatuses,
  attendanceCSV,
  attendanceCopy,
  businessDate as today,
  shiftDate,
  shiftMonth,
  formatMonthLabel,
  formatDayName,
  studentPerformance,
} from "@partner-shared/attendance";
import type { AttendanceStatus, Client } from "@partner-shared/types";
import AttendanceSummary from "./AttendanceSummary";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  AlertTriangle,
} from "lucide-react";

const useAttendance = createAttendanceHook(React);

const api: Client = (path, body) =>
  apiJSON(
    path,
    body === undefined
      ? undefined
      : { method: "POST", body: JSON.stringify(body) },
  );

type ViewMode = "day" | "month";
type MonthFilter = "all" | "regular" | "attention" | "at_risk";

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

  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [monthSearch, setMonthSearch] = useState("");
  const [monthFilter, setMonthFilter] = useState<MonthFilter>("all");

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
    if (!dirty || window.confirm("Discard unsaved attendance changes?")) {
      action();
    }
  }

  const currentCourse = useMemo(
    () => courses.find((c) => c.id === courseId),
    [courses, courseId],
  );

  function exportMonthCsv() {
    const courseName = currentCourse?.name || "Course Attendance";
    const url = URL.createObjectURL(
      new Blob([attendanceCSV(sessions, courseName)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${date.slice(0, 7)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportDayCsv() {
    const courseName = currentCourse?.name || "Course Attendance";
    const daySessions = sessions.filter((s) => s.date === date);
    if (!daySessions.length) {
      alert("No saved register found for this date to export.");
      return;
    }
    const url = URL.createObjectURL(
      new Blob([attendanceCSV(daySessions, courseName)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${date}-${label || "register"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // Monthly Overview Calculations
  const monthlyMetrics = useMemo(() => {
    const allRows = sessions.flatMap((s) => s.records);
    const overallRate = attendanceRate(allRows);
    const attendedCount = allRows.filter(
      (r) => r.status === "present" || r.status === "late",
    ).length;
    const regularCount = monthly.filter(
      (m) => (attendanceRate(m.records) ?? 0) >= 80,
    ).length;
    const atRiskCount = monthly.filter(
      (m) => (attendanceRate(m.records) ?? 0) < 60,
    ).length;

    return {
      sessionCount: sessions.length,
      studentCount: monthly.length,
      overallRate,
      attendedCount,
      regularCount,
      atRiskCount,
    };
  }, [sessions, monthly]);

  const filteredMonthly = useMemo(() => {
    return monthly.filter(({ student, records: recs }) => {
      const query = monthSearch.trim().toLowerCase();
      const matchesSearch = query
        ? `${student.name} ${student.memberNumber}`.toLowerCase().includes(query)
        : true;
      if (!matchesSearch) return false;

      const studentRate = attendanceRate(recs);
      if (monthFilter === "regular")
        return studentRate !== null && studentRate >= 80;
      if (monthFilter === "attention")
        return studentRate !== null && studentRate < 80 && studentRate >= 50;
      if (monthFilter === "at_risk")
        return studentRate === null || studentRate < 50;
      return true;
    });
  }, [monthly, monthSearch, monthFilter]);

  const isCurrentMonth = date.slice(0, 7) >= today().slice(0, 7);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6">
      {/* Header & Export Actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {attendanceCopy.title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {admin
              ? "Review training attendance and branch statistics across dojo courses."
              : "Record daily attendance and analyze monthly student attendance consistency."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {viewMode === "day" && (
            <Button
              variant="outline"
              size="sm"
              onClick={exportDayCsv}
              disabled={!sessions.some((s) => s.date === date) || loading}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export Day CSV
            </Button>
          )}
          <Button
            variant="default"
            size="sm"
            onClick={exportMonthCsv}
            disabled={!sessions.length || loading}
            className="gap-2 bg-primary"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Month CSV
          </Button>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="inline-flex rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => navigate(() => setViewMode("day"))}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            viewMode === "day"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <CheckCircle2 className="h-4 w-4 text-primary" />
          Daily Register
        </button>
        <button
          type="button"
          onClick={() => navigate(() => setViewMode("month"))}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
            viewMode === "month"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="h-4 w-4 text-primary" />
          Month View & Analytics
        </button>
      </div>

      {/* Alerts & Messages */}
      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => navigate(retry)}>
            Reload
          </Button>
        </div>
      )}
      {message && (
        <p role="status" className="text-sm font-medium text-emerald-600">
          {message}
        </p>
      )}

      {/* VIEW MODE: DAILY REGISTER */}
      {viewMode === "day" ? (
        <>
          {/* Course, Date, and Session Selection Controls */}
          <div className="grid gap-4 rounded-xl border bg-card p-5 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Course
              <select
                className="mt-2 w-full rounded-md border bg-background p-2.5 text-sm"
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

            <div className="text-sm font-medium">
              <div className="flex items-center justify-between">
                <span>Training date</span>
                {date !== today() && (
                  <button
                    type="button"
                    onClick={() => navigate(() => setDate(today()))}
                    className="text-xs text-primary hover:underline"
                  >
                    Today
                  </button>
                )}
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  disabled={busy}
                  onClick={() => navigate(() => setDate(shiftDate(date, -1)))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Input
                  className="h-10 text-center text-sm font-medium"
                  type="date"
                  max={today()}
                  value={date}
                  disabled={busy}
                  onChange={(e) => {
                    if (e.target.value) navigate(() => setDate(e.target.value));
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  disabled={date >= today() || busy}
                  onClick={() => navigate(() => setDate(shiftDate(date, 1)))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <label className="text-sm font-medium">
              Session name
              <Input
                className="mt-2 h-10"
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
            <div
              role="status"
              className="flex items-center justify-center rounded-xl border bg-card p-12 text-sm text-muted-foreground"
            >
              Loading attendance register…
            </div>
          ) : !courseId ? (
            <p className="rounded-xl border bg-card p-8 text-sm text-muted-foreground">
              Create a branch course and enroll students to start taking attendance.
            </p>
          ) : (
            <>
              {/* Daily Register Section */}
              <section className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
                  <div>
                    <h2 className="text-lg font-bold">
                      {date} ({formatDayName(date)}) · {label || "Training"}
                    </h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {version ? "Saved register" : "New register"} ·{" "}
                      {students.length} active students
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs font-semibold">
                      {records.filter((r) => r.status !== "unmarked").length} /{" "}
                      {records.length} marked
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder={attendanceCopy.search}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canWrite || busy || !students.length}
                    onClick={markAllPresent}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    {attendanceCopy.bulk}
                  </Button>
                </div>

                {!records.length ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No active enrolled students for this course and date.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {visible.map((r) => (
                      <div
                        key={r.profileId}
                        className="grid items-center gap-3 rounded-lg border bg-background/50 p-3.5 transition-colors hover:bg-muted/40 md:grid-cols-[minmax(0,1.2fr)_170px_minmax(0,1fr)]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {r.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.memberNumber}
                            {!active.has(r.profileId) && (
                              <span className="text-amber-600">
                                {" "}
                                · Historical
                              </span>
                            )}
                          </p>
                        </div>
                        <select
                          aria-label={`Attendance for ${r.name}`}
                          className={`rounded-md border p-2 text-sm font-medium transition-colors ${
                            r.status === "present"
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                              : r.status === "late"
                                ? "border-amber-300 bg-amber-50 text-amber-800"
                                : r.status === "absent"
                                  ? "border-rose-300 bg-rose-50 text-rose-800"
                                  : r.status === "excused"
                                    ? "border-slate-300 bg-slate-50 text-slate-800"
                                    : "bg-background text-muted-foreground"
                          }`}
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
                          className="h-9 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <label className="block text-sm font-medium">
                  Session notes
                  <textarea
                    className="mt-2 min-h-20 w-full rounded-md border bg-background p-3 text-sm"
                    value={notes}
                    maxLength={1000}
                    disabled={!canWrite || busy}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="General observations, workout focus, or reminders for this training session…"
                  />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                  <p className="text-xs text-muted-foreground">
                    {attendanceCopy.rateHelp}
                  </p>
                  <Button
                    disabled={
                      !canWrite || busy || !records.length || !label.trim()
                    }
                    onClick={save}
                    className="gap-2"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {busy ? "Saving…" : attendanceCopy.save}
                  </Button>
                </div>
              </section>

              {/* Quick Jump to Month View Card */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">
                      Want monthly aggregates for {formatMonthLabel(date)}?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Explore detailed student percentage breakdowns, streaks, and
                      timeline logs.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(() => setViewMode("month"))}
                  className="gap-1.5"
                >
                  Open Month View <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        /* VIEW MODE: MONTHLY OVERVIEW & ANALYTICS */
        <div className="space-y-6">
          {/* Month Navigator Card */}
          <div className="rounded-xl border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <label className="min-w-48 text-sm font-medium">
                Course
                <select
                  className="mt-1.5 w-full rounded-md border bg-background p-2 text-sm"
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

              {/* Month Switcher */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={busy}
                  onClick={() => navigate(() => setDate(shiftMonth(date, -1)))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-center">
                  <h3 className="text-base font-bold">
                    {formatMonthLabel(date)}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {sessions.length} sessions recorded
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  disabled={isCurrentMonth || busy}
                  onClick={() => navigate(() => setDate(shiftMonth(date, 1)))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {!isCurrentMonth && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(() => setDate(today()))}
                  className="text-xs text-primary"
                >
                  Jump to {formatMonthLabel(today())}
                </Button>
              )}
            </div>
          </div>

          {/* Monthly KPI Overview Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Sessions Held
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight">
                {monthlyMetrics.sessionCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Recorded in {formatMonthLabel(date)}
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Overall Attendance Rate
              </p>
              <p
                className={`mt-2 text-2xl font-bold tracking-tight ${
                  (monthlyMetrics.overallRate ?? 0) >= 80
                    ? "text-emerald-600"
                    : (monthlyMetrics.overallRate ?? 0) >= 60
                      ? "text-amber-600"
                      : "text-rose-600"
                }`}
              >
                {monthlyMetrics.overallRate !== null
                  ? `${monthlyMetrics.overallRate}%`
                  : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Average across all classes
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Total Attendances
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-primary">
                {monthlyMetrics.attendedCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Present + Late student marks
              </p>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <p className="text-xs font-medium text-muted-foreground">
                Regular Students (≥80%)
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-600">
                {monthlyMetrics.regularCount}{" "}
                <span className="text-sm font-normal text-muted-foreground">
                  / {monthlyMetrics.studentCount}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Consistently attending
              </p>
            </div>
          </div>

          {/* Student Monthly Performance Breakdown */}
          <div className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div>
                <h2 className="text-lg font-bold">
                  Student Monthly Performance
                </h2>
                <p className="text-xs text-muted-foreground">
                  Individual attendance rates, breakdown counts, and chronological history
                </p>
              </div>
              <Badge variant="outline">
                {filteredMonthly.length} of {monthly.length} students
              </Badge>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 text-sm"
                  placeholder="Search student or member ID…"
                  value={monthSearch}
                  onChange={(e) => setMonthSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "all", label: `All (${monthly.length})` },
                  {
                    key: "regular",
                    label: `Regular ≥80% (${monthlyMetrics.regularCount})`,
                  },
                  {
                    key: "attention",
                    label: `Needs Attention (${
                      monthly.length -
                      monthlyMetrics.regularCount -
                      monthlyMetrics.atRiskCount
                    })`,
                  },
                  {
                    key: "at_risk",
                    label: `At Risk <60% (${monthlyMetrics.atRiskCount})`,
                  },
                ].map((f) => (
                  <Button
                    key={f.key}
                    variant={monthFilter === f.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setMonthFilter(f.key as MonthFilter)}
                    className="h-8 text-xs font-semibold"
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Students Monthly List */}
            {!filteredMonthly.length ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {monthSearch
                  ? "No students match your search filter."
                  : "No attendance data recorded yet for this month. Switch to Daily Register to start marking!"}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredMonthly.map(({ student, records: recs }) => {
                  const studentRate = attendanceRate(recs);
                  const present = recs.filter((r) => r.status === "present").length;
                  const late = recs.filter((r) => r.status === "late").length;
                  const absent = recs.filter((r) => r.status === "absent").length;
                  const excused = recs.filter((r) => r.status === "excused").length;
                  const attended = present + late;
                  const perf = studentPerformance(studentRate);
                  const remarks = recs
                    .filter((r) => r.notes?.trim())
                    .map((r) => r.notes?.trim());

                  return (
                    <div
                      key={student.profileId}
                      className="space-y-3 rounded-xl border bg-background/50 p-4 transition-colors hover:bg-muted/40"
                    >
                      {/* Name, Member ID, and Performance Rating */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-foreground">
                              {student.name}
                            </h4>
                            {!active.has(student.profileId) && (
                              <Badge variant="outline" className="text-[10px]">
                                Historical
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {student.memberNumber}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-bold"
                            style={{
                              backgroundColor: perf.badgeBg,
                              color: perf.color,
                            }}
                          >
                            {studentRate !== null ? `${studentRate}% · ` : ""}
                            {perf.label}
                          </span>
                        </div>
                      </div>

                      {/* Attendance Progress Bar */}
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${studentRate ?? 0}%`,
                            backgroundColor: perf.color,
                          }}
                        />
                      </div>

                      {/* Breakdown Counts */}
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-foreground">
                            {attended} / {sessions.length} attended
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-medium text-emerald-600">
                            Present: {present}
                          </span>
                          <span className="font-medium text-amber-600">
                            Late: {late}
                          </span>
                          <span className="font-medium text-rose-600">
                            Absent: {absent}
                          </span>
                          <span className="font-medium text-slate-600">
                            Excused: {excused}
                          </span>
                        </div>

                        {/* Chronological Session Badges */}
                        <div className="flex flex-wrap gap-1">
                          {sessions
                            .slice()
                            .reverse()
                            .map((s) => {
                              const r = s.records.find(
                                (rec) => rec.profileId === student.profileId,
                              );
                              const st = r?.status || "unmarked";
                              const dayNum = s.date.slice(8);
                              return (
                                <span
                                  key={s.id}
                                  title={`${s.date} ${s.label}: ${st}`}
                                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                                    st === "present"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : st === "late"
                                        ? "bg-amber-100 text-amber-800"
                                        : st === "absent"
                                          ? "bg-rose-100 text-rose-800"
                                          : st === "excused"
                                            ? "bg-slate-100 text-slate-800"
                                            : "bg-muted text-muted-foreground"
                                  }`}
                                >
                                  {dayNum} {st[0].toUpperCase()}
                                </span>
                              );
                            })}
                        </div>
                      </div>

                      {remarks.length > 0 && (
                        <p className="text-xs italic text-muted-foreground">
                          Latest remark: &ldquo;{remarks[remarks.length - 1]}&rdquo;
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Recorded Sessions Timeline */}
          <div className="space-y-4 rounded-xl border bg-card p-5 sm:p-6">
            <h2 className="text-lg font-bold">
              Recorded Sessions in {formatMonthLabel(date)}
            </h2>
            <p className="text-xs text-muted-foreground">
              Click any session to jump directly to its daily register for inspection or edits
            </p>

            <div className="divide-y rounded-lg border">
              {sessions.map((session) => {
                const attended = session.records.filter(
                  (r) => r.status === "present" || r.status === "late",
                ).length;
                const sessionRate = attendanceRate(session.records);

                return (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-3 p-3.5 transition-colors hover:bg-muted/40"
                  >
                    <div>
                      <p className="text-sm font-semibold">
                        {session.date} ({formatDayName(session.date)}) ·{" "}
                        {session.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {attended} / {session.records.length} attended ·{" "}
                        {sessionRate ?? "—"}%
                        {session.notes ? ` · Note: ${session.notes}` : ""}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate(() => {
                          setDate(session.date);
                          setLabel(session.label);
                          setViewMode("day");
                        })
                      }
                      className="gap-1.5 text-xs font-semibold"
                    >
                      Open Register <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}

              {!sessions.length && (
                <p className="p-4 text-sm text-muted-foreground">
                  No sessions recorded yet for {formatMonthLabel(date)}.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
