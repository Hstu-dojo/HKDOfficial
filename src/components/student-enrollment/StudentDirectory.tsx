"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StudentRecord from "./StudentRecord";
export default function StudentDirectory() {
  const [q, setQ] = useState(""),
    [partnerId, setPartnerId] = useState(""),
    [page, setPage] = useState(1),
    [data, setData] = useState<any>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [recordId, setRecordId] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/student-records?${new URLSearchParams({ q, partnerId, page: String(page) })}`,
          { signal: controller.signal },
        );
        const result = await response.json();
        if (!response.ok) throw Error(result.error);
        setData(result);
        setError("");
      } catch (error: any) {
        if (error.name !== "AbortError") setError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, partnerId, page]);
  return (
    <div className="portal-page space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Student records</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enrollment information, scanned forms and supporting documents.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          aria-label="Search students"
          value={q}
          placeholder="Name, email or member number"
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
        />
        <select
          aria-label="Organization"
          className="rounded-md border bg-background px-3 py-2 text-sm"
          value={partnerId}
          onChange={(event) => {
            setPartnerId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">All organizations</option>
          {data?.organizations.map((partner: any) => (
            <option key={partner.id} value={partner.id}>
              {partner.name}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <div className="divide-y rounded-xl border bg-card">
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading students…</p>
        ) : data?.students.length ? (
          data.students.map((student: any) => (
            <div
              key={student.id}
              className="flex flex-wrap items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <p className="break-words text-sm font-semibold">
                  {student.name ||
                    student.nameBangla ||
                    student.email ||
                    student.memberNumber}
                </p>
                <p className="break-all text-xs text-muted-foreground">
                  {student.memberNumber} · {student.email} ·{" "}
                  {student.organization}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRecordId(student.id)}
              >
                View record & documents
              </Button>
            </div>
          ))
        ) : (
          <p className="p-6 text-sm text-muted-foreground">
            No matching students.
          </p>
        )}
      </div>
      {data?.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            disabled={loading || page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm">
            {page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            disabled={loading || page >= data.pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
      {recordId && (
        <StudentRecord profileId={recordId} onClose={() => setRecordId(null)} />
      )}
    </div>
  );
}
