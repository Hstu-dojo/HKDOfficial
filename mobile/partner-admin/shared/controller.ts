import type {
  AttendanceRow,
  AttendanceStatus,
  Client,
  Course,
  Register,
  Student,
} from "./types";
import {
  attendanceStatuses,
  attendanceCopy,
  businessDate,
  mergeRoster,
  monthlySummary,
} from "./attendance";
import { attendanceInput } from "./validation";
type Setter<T> = (value: T | ((previous: T) => T)) => void;
type Hooks = {
  useState<T>(initial: T | (() => T)): [T, Setter<T>];
  useEffect(effect: () => void | (() => void), deps: readonly unknown[]): void;
  useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  useRef<T>(initial: T): { current: T };
};
// This factory shares every attendance state transition without importing either React runtime.
export function createAttendanceHook({
  useState,
  useEffect,
  useMemo,
  useRef,
}: Hooks) {
  return function useAttendance(api: Client) {
    const [courses, setCourses] = useState<Course[]>([]),
      [courseId, selectCourse] = useState(""),
      [date, selectDate] = useState(businessDate),
      [label, selectLabel] = useState("Training"),
      [students, setStudents] = useState<Student[]>([]),
      [sessions, setSessions] = useState<Register[]>([]),
      [records, setRecords] = useState<AttendanceRow[]>([]),
      [notes, editNotes] = useState(""),
      [version, setVersion] = useState<string | null>(null),
      [canWrite, setCanWrite] = useState(false),
      [busy, setBusy] = useState(false),
      [loading, setLoading] = useState(true),
      [error, setError] = useState(""),
      [message, setMessage] = useState(""),
      [search, setSearch] = useState(""),
      [dirty, setDirty] = useState(false),
      [revision, setRevision] = useState(0),
      [metadataRetry, setMetadataRetry] = useState(0);
    const saving = useRef(false),
      mounted = useRef(true);
    useEffect(() => {
      mounted.current = true;
      return () => {
        mounted.current = false;
      };
    }, []);
    useEffect(() => {
      let canceled = false,
        hasCourse = false;
      setLoading(true);
      setError("");
      api<{ courses: Course[]; canWrite: boolean }>("/api/course-attendance")
        .then((data) => {
          if (canceled) return;
          setCourses(data.courses);
          const first =
            data.courses.find((c) => c.isActive)?.id ||
            data.courses[0]?.id ||
            "";
          hasCourse = !!first;
          selectCourse(first);
        })
        .catch((e) => {
          if (!canceled) setError(e.message);
        })
        .finally(() => {
          if (!canceled && !hasCourse) setLoading(false);
        });
      return () => {
        canceled = true;
      };
    }, [api, metadataRetry]);
    useEffect(() => {
      if (!courseId) return;
      let canceled = false;
      setLoading(true);
      setCanWrite(false);
      setStudents([]);
      setSessions([]);
      setError("");
      setMessage("");
      api<{ students: Student[]; sessions: Register[]; canWrite: boolean }>(
        `/api/course-attendance?courseId=${encodeURIComponent(courseId)}&date=${date}`,
      )
        .then((data) => {
          if (canceled) return;
          setStudents(data.students);
          setSessions(data.sessions);
          setCanWrite(data.canWrite);
        })
        .catch((e) => {
          if (!canceled) setError(e.message);
        })
        .finally(() => {
          if (!canceled) setLoading(false);
        });
      return () => {
        canceled = true;
      };
    }, [api, courseId, date, revision]);
    useEffect(() => {
      const current = sessions.find(
        (s) => s.date === date && s.label === label,
      );
      setRecords(mergeRoster(students, current));
      editNotes(current?.notes || "");
      setVersion(current?.updatedAt || null);
      setDirty(false);
    }, [students, sessions, date, label]);
    const active = useMemo(
      () => new Set(students.map((s) => s.profileId)),
      [students],
    );
    const visible = useMemo(
      () =>
        records.filter((r) =>
          `${r.name} ${r.memberNumber}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
      [records, search],
    );
    const monthly = useMemo(() => monthlySummary(sessions), [sessions]);
    function mark(profileId: string, status: AttendanceStatus) {
      if (
        !canWrite ||
        saving.current ||
        !active.has(profileId) ||
        !attendanceStatuses.includes(status)
      )
        return;
      setRecords((rows) =>
        rows.map((r) => (r.profileId === profileId ? { ...r, status } : r)),
      );
      setDirty(true);
      setMessage("");
    }
    function markAllPresent() {
      if (!canWrite || saving.current) return;
      setRecords((rows) =>
        rows.map((r) =>
          active.has(r.profileId) ? { ...r, status: "present" } : r,
        ),
      );
      setDirty(true);
      setMessage("");
    }
    function setStudentNote(profileId: string, notes: string) {
      if (!canWrite || saving.current || !active.has(profileId)) return;
      setRecords((rows) =>
        rows.map((r) => (r.profileId === profileId ? { ...r, notes } : r)),
      );
      setDirty(true);
    }
    function setNotes(value: string) {
      if (!canWrite || saving.current) return;
      editNotes(value);
      setDirty(true);
    }
    async function save() {
      if (saving.current || !canWrite) return;
      if (records.some((r) => r.status === "unmarked")) {
        setError(attendanceCopy.unmarked);
        return;
      }
      const parsed = attendanceInput.safeParse({
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
      });
      if (!parsed.success) {
        setError(parsed.error.issues.map((i) => i.message).join("; "));
        return;
      }
      saving.current = true;
      setBusy(true);
      setError("");
      try {
        const data = await api<{ session: Register }>(
          "/api/course-attendance",
          parsed.data,
        );
        if (!mounted.current) return;
        setSessions((previous) => [
          ...previous.filter((s) => s.id !== data.session.id),
          data.session,
        ]);
        selectLabel(data.session.label);
        setDirty(false);
        setMessage(attendanceCopy.saved);
      } catch (e: any) {
        if (mounted.current) setError(e.message);
      } finally {
        saving.current = false;
        if (mounted.current) setBusy(false);
      }
    }
    return {
      courses,
      courseId,
      date,
      label,
      students,
      sessions,
      records,
      notes,
      version,
      canWrite,
      busy,
      loading,
      error,
      message,
      search,
      dirty,
      active,
      visible,
      monthly,
      marked: records.filter((r) => r.status !== "unmarked").length,
      setSearch,
      setError,
      mark,
      markAllPresent,
      setStudentNote,
      setNotes,
      save,
      setCourseId: (value: string) => {
        if (!saving.current) selectCourse(value);
      },
      setDate: (value: string) => {
        if (!saving.current) selectDate(value);
      },
      setLabel: (value: string) => {
        if (!saving.current) selectLabel(value);
      },
      retry: () => {
        if (saving.current) return;
        if (!courseId) setMetadataRetry((n) => n + 1);
        else setRevision((n) => n + 1);
      },
    };
  };
}
