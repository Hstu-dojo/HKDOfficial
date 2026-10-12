import type { AttendanceRow, Register, Student } from "./types";
export { attendanceStatuses } from "./types";
export function businessDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function shiftDate(value: string, days: number) {
  return new Date(new Date(value + "T12:00:00Z").getTime() + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function mergeRoster(
  students: Student[],
  register?: Register,
): AttendanceRow[] {
  const previous = new Map(
      register?.records.map((r) => [r.profileId, r]) || [],
    ),
    active = new Set(students.map((s) => s.profileId));
  return [
    ...students.map((student) => ({
      ...student,
      status: previous.get(student.profileId)?.status || ("unmarked" as const),
      notes: previous.get(student.profileId)?.notes || "",
    })),
    ...(register?.records.filter((row) => !active.has(row.profileId)) || []),
  ];
}
export function attendanceRate(rows: { status: string }[]) {
  const counted = rows.filter(
    (r) => r.status !== "excused" && r.status !== "unmarked",
  );
  return counted.length
    ? Math.round(
        (counted.filter((r) => r.status === "present" || r.status === "late")
          .length /
          counted.length) *
          100,
      )
    : null;
}
export function monthlySummary(sessions: Register[]) {
  const result = new Map<
    string,
    { student: Student; records: AttendanceRow[] }
  >();
  for (const session of sessions)
    for (const row of session.records) {
      if (!result.has(row.profileId))
        result.set(row.profileId, { student: row, records: [] });
      result.get(row.profileId)!.records.push(row);
    }
  return [...result.values()];
}
export function attendanceMetrics(sessions: Register[]) {
  const rows = sessions.flatMap((s) => s.records),
    rate = attendanceRate(rows);
  return [
    { label: "Sessions this month", value: sessions.length },
    {
      label: "Present / late",
      value: rows.filter((r) => r.status === "present" || r.status === "late")
        .length,
    },
    {
      label: "Absent",
      value: rows.filter((r) => r.status === "absent").length,
    },
    { label: "Attendance rate", value: rate === null ? "—" : `${rate}%` },
  ];
}
export function shiftMonth(date: string, months: number): string {
  const [y, m] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const year = target.getUTCFullYear();
  const month = String(target.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}
export function formatMonthLabel(date: string): string {
  const [y, m] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1, 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(target);
}
export function formatDayName(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(target);
}
export function studentPerformance(rate: number | null): {
  label: string;
  color: string;
  badgeBg: string;
} {
  if (rate === null) return { label: "Unmarked", color: "#727180", badgeBg: "#ece9f4" };
  if (rate >= 85) return { label: "Excellent", color: "#157552", badgeBg: "#e3f5ec" };
  if (rate >= 70) return { label: "Good", color: "#6020ec", badgeBg: "#eee7ff" };
  if (rate >= 50) return { label: "Average", color: "#966014", badgeBg: "#fff2df" };
  return { label: "At Risk", color: "#c03648", badgeBg: "#ffe7ea" };
}
export function attendanceCSV(sessions: Register[], courseName?: string) {
  const cell = (value: string | number) => {
    const str = String(value ?? "");
    return (
      '"' +
      (/^\s*[=+@\-\t\r]/.test(str) ? "'" : "") +
      str.replaceAll('"', '""') +
      '"'
    );
  };
  const rows = sessions.flatMap((s) => s.records);
  const overallRate = attendanceRate(rows);
  const monthStr = sessions[0]?.date ? sessions[0].date.slice(0, 7) : businessDate().slice(0, 7);
  const studentsSummaries = monthlySummary(sessions);

  const metadataRows: (string | number)[][] = [
    ["KAIZEN KARATE ACADEMY - ATTENDANCE REPORT"],
    ["Course", courseName || "Dojo Course Attendance"],
    ["Month Period", monthStr],
    ["Generated Date", businessDate()],
    ["Total Sessions Recorded", sessions.length],
    ["Total Students Evaluated", studentsSummaries.length],
    ["Overall Attendance Rate", overallRate === null ? "—" : `${overallRate}%`],
    [],
    ["=== STUDENT MONTHLY SUMMARY ==="],
    [
      "Member ID",
      "Student Name",
      "Total Sessions",
      "Present Count",
      "Late Count",
      "Attended Total (Present + Late)",
      "Absent Count",
      "Excused Count",
      "Attendance Rate (%)",
      "Performance Status",
    ],
    ...studentsSummaries.map(({ student, records }) => {
      const studentRate = attendanceRate(records);
      const presentCount = records.filter((r) => r.status === "present").length;
      const lateCount = records.filter((r) => r.status === "late").length;
      const attendedCount = presentCount + lateCount;
      const absentCount = records.filter((r) => r.status === "absent").length;
      const excusedCount = records.filter((r) => r.status === "excused").length;
      const perf = studentPerformance(studentRate);
      return [
        student.memberNumber,
        student.name,
        records.length,
        presentCount,
        lateCount,
        attendedCount,
        absentCount,
        excusedCount,
        studentRate === null ? "—" : `${studentRate}%`,
        perf.label,
      ];
    }),
    [],
    ["=== DETAILED SESSION-BY-SESSION LOGS ==="],
    [
      "Date",
      "Day",
      "Session",
      "Member ID",
      "Student Name",
      "Status",
      "Student Notes",
      "Session Notes",
    ],
    ...sessions.flatMap((s) =>
      s.records.map((r) => [
        s.date,
        formatDayName(s.date),
        s.label,
        r.memberNumber,
        r.name,
        r.status,
        r.notes,
        s.notes || "",
      ]),
    ),
  ];

  return "\uFEFF" + metadataRows.map((row) => row.map(cell).join(",")).join("\r\n");
}
export const attendanceCopy = {
  title: "Course attendance",
  search: "Search name or member number",
  bulk: "Mark all present",
  save: "Save attendance",
  saved: "Attendance saved.",
  unmarked: "Mark every active student before saving.",
  rateHelp:
    "Late counts as attended. Excused absences are excluded from the attendance rate.",
};
