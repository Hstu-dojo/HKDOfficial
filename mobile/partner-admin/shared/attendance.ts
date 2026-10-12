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
export function attendanceCSV(sessions: Register[]) {
  const cell = (value: string) =>
    '"' +
    (/^\s*[=+@\-\t\r]/.test(value) ? "'" : "") +
    value.replaceAll('"', '""') +
    '"';
  return (
    "\uFEFF" +
    [
      ["Date", "Session", "Name", "Member number", "Status", "Notes"],
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
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n")
  );
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
