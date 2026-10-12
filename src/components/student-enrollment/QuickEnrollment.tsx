"use client";
import { useEffect, useState, useRef } from "react";
import { Dialog } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  enrollmentFields,
  enrollmentSections,
  blankFields,
  submitSchema,
} from "@/lib/student-enrollment/model";
import { XMarkIcon } from "@heroicons/react/24/outline";
type Scan = {
  draftId: string;
  sourceUrl: string;
  fields: Record<string, string>;
  warnings: string[];
  photoBox: number[] | null;
  signatureBox: number[] | null;
};
type Course = {
  id: string;
  name: string;
  admissionFee: number;
  monthlyFee: number;
  currency: string;
};
async function jsonFetch(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const data = await response
    .json()
    .catch(() => ({
      error: "The service is temporarily unavailable. Please retry.",
    }));
  if (!response.ok) throw Error(data.error || "Request failed");
  return data;
}
function CropPreview({ source, box }: { source: string; box: number[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled || !canvas.current) return;
      const [y1, x1, y2, x2] = box,
        w = ((x2 - x1) * image.width) / 1000,
        h = ((y2 - y1) * image.height) / 1000;
      if (w <= 0 || h <= 0) return;
      const scale = Math.min(240 / w, 180 / h);
      canvas.current.width = Math.max(1, Math.round(w * scale));
      canvas.current.height = Math.max(1, Math.round(h * scale));
      canvas.current
        .getContext("2d")
        ?.drawImage(
          image,
          (x1 * image.width) / 1000,
          (y1 * image.height) / 1000,
          w,
          h,
          0,
          0,
          canvas.current.width,
          canvas.current.height,
        );
    };
    image.src = source;
    return () => {
      cancelled = true;
    };
  }, [source, box]);
  return (
    <canvas
      ref={canvas}
      className="mx-auto max-h-40 max-w-full rounded border object-contain"
      aria-label="Crop preview"
    />
  );
}
function CropEditor({
  label,
  box,
  source,
  onChange,
  onUpload,
}: {
  label: string;
  box: number[] | null;
  source: string;
  onChange: (box: number[] | null) => void;
  onUpload: (file: File | null, box: number[] | null) => void;
}) {
  const [upload, setUpload] = useState<File | null>(null);
  const [uploadUrl, setUploadUrl] = useState("");
  useEffect(() => {
    if (!upload) { setUploadUrl(""); return; }
    const url = URL.createObjectURL(upload);
    setUploadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [upload]);
  const cropSource = uploadUrl || source;
  return (
    <div className="space-y-3 rounded-xl border p-4">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm font-semibold">{label}</h4>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onChange(box ? null : [0, 0, 200, 200])}
        >
          {box ? "Remove crop" : "Select crop"}
        </Button>
      </div>
      {box && (
        <>
          <ReactCrop crop={{ unit: "%", x: box[1] / 10, y: box[0] / 10, width: (box[3] - box[1]) / 10, height: (box[2] - box[0]) / 10 }}
            onChange={(_, crop) => {
              const next = [crop.y * 10, crop.x * 10, (crop.y + crop.height) * 10, (crop.x + crop.width) * 10];
              onChange(next);
              if (upload) onUpload(upload, next);
            }}>
            <img src={cropSource} alt={`Adjust ${label.toLowerCase()} crop`} className="max-h-96 w-auto max-w-full object-contain" />
          </ReactCrop>
          <CropPreview source={cropSource} box={box} />
          <p className="text-xs text-muted-foreground">
            Drag the selection or its edges to adjust. You can also draw a new selection.
          </p>
        </>
      )}
      <label className="block text-xs text-muted-foreground">
        Upload a separate {label.toLowerCase()} (JPEG, PNG or WebP, up to 3 MB)
        <Input className="mt-2" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
          const file = event.target.files?.[0] || null;
          if (file && file.size > 3 * 1024 * 1024) { event.target.setCustomValidity("Choose an image smaller than 3 MB"); event.target.reportValidity(); return; }
          event.target.setCustomValidity("");
          setUpload(file);
          const next = file ? [0, 0, 1000, 1000] : null;
          onChange(next);
          onUpload(file, next);
        }} />
      </label>
      {upload && <Button type="button" variant="outline" size="sm" onClick={() => { setUpload(null); onUpload(null, null); onChange(null); }}>Use scanned form instead</Button>}
    </div>
  );
}
export default function QuickEnrollment({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [manualImages, setManualImages] = useState<Record<string, File | null>>({});
  const [courses, setCourses] = useState<Course[]>([]),
    [scan, setScan] = useState<Scan | null>(null),
    [file, setFile] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [manual, setManual] = useState(false),
    [courseId, setCourseId] = useState(""),
    [paymentCollected, setPaymentCollected] = useState(false),
    [paymentReference, setPaymentReference] = useState(""),
    [reviewed, setReviewed] = useState(false),
    [agreement, setAgreement] = useState(false),
    [startDate, setStartDate] = useState(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date()),
    ),
    [result, setResult] = useState<any>(null),
    [configured, setConfigured] = useState<{
      aiConfigured: boolean;
      authConfigured: boolean;
      storageConfigured?: boolean;
    } | null>(null);
  useEffect(() => {
    jsonFetch("/api/partner-portal/quick-enrollment")
      .then((data) => {
        setCourses(data.courses);
        setConfigured(data);
        if (!data.aiConfigured) setManual(true);
      })
      .catch((error) => setError(error.message));
  }, []);
  async function scanFile() {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("manual", String(manual));
      setScan(
        await jsonFetch("/api/partner-portal/quick-enrollment", {
          method: "POST",
          body,
        }),
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  function change(id: string, value: string) {
    setScan((previous) =>
      previous
        ? { ...previous, fields: { ...previous.fields, [id]: value } }
        : previous,
    );
    setReviewed(false);
  }
  async function submit() {
    if (!scan) return;
    if (Object.values(manualImages).reduce((total, file) => total + (file?.size || 0), 0) > 3 * 1024 * 1024) {
      setError("The separate photo and signature must total less than 3 MB. Choose smaller images.");
      return;
    }
    const payload = {
      draftId: scan.draftId,
      courseId,
      fields: { ...blankFields, ...scan.fields },
      photoBox: scan.photoBox,
      signatureBox: scan.signatureBox,
      startDate,
      paymentCollected,
      paymentReference,
      agreement,
      reviewed,
    };
    const parsed = submitSchema.safeParse(payload);
    if (!parsed.success) {
      setError(
        parsed.error.issues
          .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
          .join("; "),
      );
      return;
    }
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("payload", JSON.stringify(parsed.data));
      for (const kind of ["photo", "signature"]) {
        if (manualImages[kind]) body.append(kind, manualImages[kind]!);
      }
      setResult(
        await jsonFetch("/api/partner-portal/quick-enrollment/submit", {
          method: "POST",
          body,
        }),
      );
      onSuccess();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function close() {
    if (busy) return;
    if (scan && !result) {
      setBusy(true);
      try {
        await jsonFetch(
          `/api/partner-portal/quick-enrollment?draftId=${encodeURIComponent(scan.draftId)}`,
          { method: "DELETE" },
        );
      } catch (error: any) {
        setError(error.message);
        setBusy(false);
        return;
      }
    }
    onClose();
  }
  const course = courses.find((course) => course.id === courseId);
  return (
    <Dialog
      open
      onClose={() => {
        if (!busy) close();
      }}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/50" />
      <div className="fixed inset-0 overflow-y-auto p-3 sm:p-6">
        <div className="flex min-h-full items-start justify-center">
          <Dialog.Panel className="shadow-xl w-full max-w-6xl rounded-2xl border bg-card">
            <div className="flex items-start justify-between gap-3 border-b p-5">
              <div>
                <Dialog.Title className="text-xl font-semibold">
                  Quick enrollment from paper form
                </Dialog.Title>
                <p className="mt-1 text-sm text-muted-foreground">
                  Scan → review and correct → create account and enroll.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={busy}
                aria-label="Close"
                onClick={close}
              >
                <XMarkIcon className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-5 p-4 sm:p-6">
              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              {result ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    {result.alreadySubmitted
                      ? "This form was already submitted"
                      : "Student account created"}
                  </h3>
                  <p className="text-sm">
                    Member: {result.memberNumber || result.profileId}.{" "}
                    {result.admissionApproved
                      ? "Enrollment approved."
                      : "Course application saved; admission payment is pending."}
                  </p>
                  {result.temporaryPassword && (
                    <div className="rounded-xl border bg-muted p-4">
                      <p className="text-sm">
                        Credentials email:{" "}
                        {result.credentialsEmailSent ? "sent" : "not sent"}
                      </p>
                      <p className="mt-2 text-sm">
                        Temporary password (shown once):
                      </p>
                      <code className="block break-all py-2">
                        {result.temporaryPassword}
                      </code>
                      <p className="text-xs text-muted-foreground">
                        Keep it private. The student should change it after
                        signing in.
                      </p>
                    </div>
                  )}
                  {result.warnings?.map((warning: string) => (
                    <p key={warning} className="text-sm">
                      {warning}
                    </p>
                  ))}
                  <Button onClick={close}>Done</Button>
                </div>
              ) : !scan ? (
                <div className="max-w-xl space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Upload one readable JPEG, PNG or WebP scan, up to 3 MB. No
                    account or email is created until you review and submit.
                  </p>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) =>
                      setFile(event.target.files?.[0] || null)
                    }
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={manual}
                      onChange={(event) => setManual(event.target.checked)}
                    />
                    Enter manually instead of AI extraction
                  </label>
                  {configured && configured.storageConfigured === false && (
                    <p className="text-sm text-muted-foreground">
                      The server needs its document encryption key before
                      uploading scans.
                    </p>
                  )}
                  {configured && !configured.authConfigured && (
                    <p className="text-sm text-muted-foreground">
                      Account creation needs the server's Supabase service role
                      key.
                    </p>
                  )}
                  <Button
                    disabled={
                      busy || !file || configured?.storageConfigured === false
                    }
                    onClick={scanFile}
                  >
                    {busy
                      ? "Reading form…"
                      : manual
                        ? "Open form preview"
                        : "Extract and preview"}
                  </Button>
                </div>
              ) : (
                <>
                  {scan.warnings.length > 0 && (
                    <div className="rounded-xl border bg-muted/40 p-4">
                      <p className="mb-2 text-sm font-semibold">
                        Check these fields
                      </p>
                      <ul className="list-disc space-y-1 pl-5 text-sm">
                        {scan.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
                    <aside className="space-y-4 lg:sticky lg:top-4">
                      <a
                        href={scan.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block"
                      >
                        <img
                          src={scan.sourceUrl}
                          alt="Original uploaded membership form"
                          className="w-full rounded-xl border"
                        />
                      </a>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        <CropEditor
                          label="Student photo"
                          onUpload={(file) => { setManualImages((previous) => ({ ...previous, photo: file })); setReviewed(false); }}
                          source={scan.sourceUrl}
                          box={scan.photoBox}
                          onChange={(box) => {
                            setScan({ ...scan, photoBox: box });
                            setReviewed(false);
                          }}
                        />
                        <CropEditor
                          label="Applicant signature"
                          onUpload={(file) => { setManualImages((previous) => ({ ...previous, signature: file })); setReviewed(false); }}
                          source={scan.sourceUrl}
                          box={scan.signatureBox}
                          onChange={(box) => {
                            setScan({ ...scan, signatureBox: box });
                            setReviewed(false);
                          }}
                        />
                      </div>
                    </aside>
                    <div className="space-y-6">
                      {enrollmentSections.map((section) => (
                        <section
                          key={section.id}
                          className="rounded-xl border p-4"
                        >
                          <h3 className="mb-4 text-base font-semibold">
                            {section.title}
                          </h3>
                          <div className="grid gap-4 sm:grid-cols-2">
                            {enrollmentFields
                              .filter((field) => field.section === section.id)
                              .map((field) => (
                                <label
                                  key={field.id}
                                  className={`min-w-0 text-sm ${field.type === "textarea" ? "sm:col-span-2" : ""}`}
                                >
                                  <span className="mb-1.5 block font-medium">
                                    {field.label}
                                    {[
                                      "name_en",
                                      "dob",
                                      "mobile",
                                      "email",
                                      "present_address",
                                    ].includes(field.id)
                                      ? " *"
                                      : ""}
                                  </span>
                                  {field.type === "textarea" ? (
                                    <textarea
                                      className="min-h-20 w-full rounded-md border bg-background p-3"
                                      maxLength={field.maxLength || 1000}
                                      value={scan.fields[field.id] || ""}
                                      onChange={(event) =>
                                        change(field.id, event.target.value)
                                      }
                                    />
                                  ) : field.type === "select" ? (
                                    <select
                                      className="h-10 w-full rounded-md border bg-background px-3"
                                      value={scan.fields[field.id] || ""}
                                      onChange={(event) =>
                                        change(field.id, event.target.value)
                                      }
                                    >
                                      <option value="">Select</option>
                                      {field.options?.map((option) => (
                                        <option
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <Input
                                      type={
                                        field.type === "number"
                                          ? "text"
                                          : field.type
                                      }
                                      maxLength={field.maxLength || 1000}
                                      value={scan.fields[field.id] || ""}
                                      onChange={(event) =>
                                        change(field.id, event.target.value)
                                      }
                                    />
                                  )}
                                </label>
                              ))}
                          </div>
                        </section>
                      ))}
                      <section className="space-y-4 rounded-xl border p-4">
                        <h3 className="font-semibold">Account & enrollment</h3>
                        <label className="block text-sm">
                          Gender *
                          <select
                            className="mt-1 w-full rounded-md border bg-background p-2"
                            value={scan.fields.gender || ""}
                            onChange={(event) =>
                              change("gender", event.target.value)
                            }
                          >
                            <option value="">Select explicitly</option>
                            {["male", "female", "other"].map((value) => (
                              <option key={value}>{value}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block text-sm">
                          Paper registration number
                          <Input
                            value={scan.fields.registration_no || ""}
                            onChange={(event) =>
                              change("registration_no", event.target.value)
                            }
                          />
                        </label>
                        <label className="block text-sm">
                          Emergency contact name
                          <Input
                            value={scan.fields.emergency_name || ""}
                            onChange={(event) =>
                              change("emergency_name", event.target.value)
                            }
                          />
                        </label>
                        <label className="block text-sm">
                          Medical condition reported
                          <select
                            className="mt-1 w-full rounded-md border bg-background p-2"
                            value={scan.fields.medical_condition || ""}
                            onChange={(event) =>
                              change("medical_condition", event.target.value)
                            }
                          >
                            <option value="">Not recorded on paper</option>
                            <option value="no">No condition reported</option>
                            <option value="yes">Yes — see details</option>
                          </select>
                        </label>
                        <label className="block text-sm">
                          Medical details (if supplied)
                          <Input
                            value={scan.fields.medical_details || ""}
                            onChange={(event) =>
                              change("medical_details", event.target.value)
                            }
                          />
                        </label>
                        <label className="block text-sm">
                          Course *
                          <select
                            className="mt-1 w-full rounded-md border bg-background p-2"
                            value={courseId}
                            onChange={(event) =>
                              setCourseId(event.target.value)
                            }
                          >
                            <option value="">
                              Select this organization's course
                            </option>
                            {courses.map((course) => (
                              <option key={course.id} value={course.id}>
                                {course.name}
                              </option>
                            ))}
                          </select>
                        </label>
                        {course && (
                          <p className="text-sm text-muted-foreground">
                            Admission: {(course.admissionFee / 100).toFixed(2)}{" "}
                            {course.currency} · Monthly:{" "}
                            {(course.monthlyFee / 100).toFixed(2)}{" "}
                            {course.currency}
                          </p>
                        )}
                        <label className="block text-sm">
                          Training start date
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(event) =>
                              setStartDate(event.target.value)
                            }
                          />
                        </label>
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            className="mt-1"
                            type="checkbox"
                            checked={paymentCollected}
                            onChange={(event) =>
                              setPaymentCollected(event.target.checked)
                            }
                          />
                          Admission payment has been collected offline. Approve
                          and enroll this student.
                        </label>
                        <p className="text-xs text-muted-foreground">
                          If the admission fee is unpaid, this creates a
                          pending-payment application. Free admission courses
                          are enrolled immediately.
                        </p>
                        <Input
                          placeholder="Offline payment reference (optional)"
                          value={paymentReference}
                          onChange={(event) =>
                            setPaymentReference(event.target.value)
                          }
                        />
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            className="mt-1"
                            type="checkbox"
                            checked={agreement}
                            onChange={(event) =>
                              setAgreement(event.target.checked)
                            }
                          />
                          The applicant or guardian has agreed to the membership
                          terms and waiver.
                        </label>
                        <label className="flex items-start gap-2 text-sm">
                          <input
                            className="mt-1"
                            type="checkbox"
                            checked={reviewed}
                            onChange={(event) =>
                              setReviewed(event.target.checked)
                            }
                          />
                          I have checked the form, email address,
                          photo/signature crops and enrollment details.
                        </label>
                        <Button
                          disabled={
                            busy ||
                            !reviewed ||
                            !agreement ||
                            !configured?.authConfigured
                          }
                          onClick={submit}
                        >
                          {busy
                            ? "Creating account and enrollment…"
                            : "Create account & submit enrollment"}
                        </Button>
                      </section>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
