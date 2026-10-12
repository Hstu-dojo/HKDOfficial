"use client";
import { useEffect, useState, useCallback } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  documentKinds,
  enrollmentFields,
  studentFormValues,
} from "@/lib/student-enrollment/model";
import { XMarkIcon } from "@heroicons/react/24/outline";
type RecordData = {
  profile: Record<string, any>;
  organization: string;
  canUpload: boolean;
  documents: {
    id: string;
    kind: string;
    filename: string;
    mimeType: string;
    size: number;
    createdAt: string;
  }[];
  applications: {
    id: string;
    applicationNumber: string;
    courseName: string;
    status: string;
    studentInfo: Record<string, any>;
  }[];
};
export default function StudentRecord({
  profileId,
  onClose,
}: {
  profileId: string;
  onClose: () => void;
}) {
  const [data, setData] = useState<RecordData | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [file, setFile] = useState<File | null>(null),
    [kind, setKind] = useState("birth_certificate"),
    [useOnProfile, setUseOnProfile] = useState(false);
  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/student-records/${profileId}`, {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setData(result);
      setError("");
    } catch (error: any) {
      setError(error.message);
    }
  }, [profileId]);
  useEffect(() => {
    load();
  }, [load]);
  async function upload() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      body.append("useOnProfile", String(useOnProfile));
      const response = await fetch(`/api/student-records/${profileId}`, {
        method: "POST",
        body,
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error);
      setFile(null);
      await load();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
        <div className="flex min-h-full justify-center">
          <Dialog.Panel className="shadow-xl w-full max-w-5xl rounded-2xl border bg-card">
            <div className="flex items-start justify-between gap-3 border-b p-5">
              <div>
                <Dialog.Title className="text-xl font-semibold">
                  {data?.profile.fullNameEnglish || "Student record"}
                </Dialog.Title>
                <p className="mt-1 text-sm text-muted-foreground">
                  {data?.profile.memberNumber} · {data?.organization}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close record"
                onClick={onClose}
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-6 p-5">
              {error && (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              )}
              {!data && !error && (
                <p className="text-sm text-muted-foreground">
                  Loading student record…
                </p>
              )}
              {data && (
                <>
                  <section>
                    <h3 className="mb-3 font-semibold">Member details</h3>
                    <dl className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2">
                      {[
                        "fullNameEnglish",
                        "fullNameBangla",
                        "email",
                        "phoneNumber",
                        "dateOfBirth",
                        "gender",
                        "fatherName",
                        "motherName",
                        "presentAddress",
                        "permanentAddress",
                        "institute",
                        "educationQualification",
                        "nationality",
                        "nid",
                        "bloodGroup",
                      ].map((key) => (
                        <div key={key} className="min-w-0">
                          <dt className="text-xs capitalize text-muted-foreground">
                            {key.replace(/([A-Z])/g, " $1")}
                          </dt>
                          <dd className="break-words text-sm">
                            {key === "dateOfBirth"
                              ? String(data.profile[key] || "—").slice(0, 10)
                              : data.profile[key] || "—"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                  <section className="space-y-3">
                    <h3 className="font-semibold">Enrollment forms</h3>
                    {data.applications.length ? (
                      data.applications.map((application) => (
                        <details
                          key={application.id}
                          className="rounded-xl border p-4"
                          open={data.applications.length === 1}
                        >
                          <summary className="cursor-pointer text-sm font-semibold">
                            {application.courseName} ·{" "}
                            {application.status.replace(/_/g, " ")} ·{" "}
                            {application.applicationNumber}
                          </summary>
                          <p className="mt-3 text-xs text-muted-foreground">
                            Medical condition:{" "}
                            {application.studentInfo.medicalConditionStatus?.replace(
                              /_/g,
                              " ",
                            ) || "not recorded"}
                            .{" "}
                            {application.studentInfo.medicalConditionDetails ||
                              ""}
                          </p>
                          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                            {enrollmentFields.map((field) => (
                              <div key={field.id} className="min-w-0">
                                <dt className="text-xs text-muted-foreground">
                                  {field.label}
                                </dt>
                                <dd className="whitespace-pre-wrap break-words text-sm">
                                  {studentFormValues(
                                    application.studentInfo,
                                    data.profile,
                                  )[field.id] || "—"}
                                </dd>
                              </div>
                            ))}
                          </dl>
                        </details>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No course application is linked to this member.
                      </p>
                    )}
                  </section>
                  <section className="space-y-3">
                    <h3 className="font-semibold">Scans & documents</h3>
                    {documentKinds
                      .filter((kind) =>
                        data.documents.some(
                          (document) => document.kind === kind,
                        ),
                      )
                      .map((kind) => (
                        <div
                          key={kind}
                          className="space-y-3 rounded-xl border p-4"
                        >
                          <h4 className="text-sm font-medium capitalize">
                            {kind.replace(/_/g, " ")}
                          </h4>
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {data.documents
                              .filter((document) => document.kind === kind)
                              .map((document) => (
                                <a
                                  key={document.id}
                                  href={`/api/student-documents/${document.id}/file`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="min-w-0 rounded-lg border p-3 hover:bg-muted"
                                >
                                  {document.mimeType.startsWith("image/") && (
                                    <img
                                      loading="lazy"
                                      src={`/api/student-documents/${document.id}/file`}
                                      alt={document.kind.replace(/_/g, " ")}
                                      className="mb-2 h-40 w-full rounded object-contain"
                                    />
                                  )}
                                  <p className="break-all text-sm font-medium">
                                    {document.filename}
                                  </p>
                                  <p className="mt-1 text-xs text-muted-foreground">
                                    {Math.round(document.size / 1024)} KB ·{" "}
                                    {new Date(
                                      document.createdAt,
                                    ).toLocaleDateString()}{" "}
                                    · Open/download
                                  </p>
                                </a>
                              ))}
                          </div>
                        </div>
                      ))}
                    {!data.documents.length && (
                      <p className="text-sm text-muted-foreground">
                        No documents saved yet.
                      </p>
                    )}
                  </section>
                  {data.canUpload && (
                    <section className="space-y-3 rounded-xl border bg-muted/30 p-4">
                      <h3 className="font-semibold">Add a document</h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="text-sm">
                          Category
                          <select
                            className="mt-1 w-full rounded-md border bg-background p-2"
                            value={kind}
                            onChange={(event) => {
                              setKind(event.target.value);
                              setUseOnProfile(false);
                            }}
                          >
                            {documentKinds.map((value) => (
                              <option key={value} value={value}>
                                {value.replace(/_/g, " ")}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="text-sm">
                          File (up to 3 MB)
                          <Input
                            className="mt-1"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,application/pdf"
                            onChange={(event) =>
                              setFile(event.target.files?.[0] || null)
                            }
                          />
                        </label>
                      </div>
                      {["photo", "signature"].includes(kind) && (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={useOnProfile}
                            onChange={(event) =>
                              setUseOnProfile(event.target.checked)
                            }
                          />
                          Use this image on the member profile
                        </label>
                      )}
                      <Button disabled={busy || !file} onClick={upload}>
                        {busy ? "Uploading…" : "Upload document"}
                      </Button>
                    </section>
                  )}
                </>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
