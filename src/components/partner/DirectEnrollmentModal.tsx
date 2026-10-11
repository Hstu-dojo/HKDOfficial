"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { FORM_SECTIONS, FORM_FIELDS } from "@/lib/pdf/form-fields";
import { toast } from "sonner";

interface Member {
  id: string;
  memberNumber: string;
  fullNameEnglish: string | null;
  fullNameBangla: string | null;
  userName?: string | null;
  phoneNumber: string | null;
  email: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  nid: string | null;
  bloodGroup: string | null;
  fatherName: string | null;
  motherName: string | null;
  occupation: string | null;
  institute: string | null;
  faculty: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  picture: string | null;
}

interface DirectEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onSuccess: () => void;
}

interface Course {
  id: string;
  name: string;
  admissionFee: number;
  monthlyFee: number;
  currency: string;
}

const visibleSections = FORM_SECTIONS.filter(
  (s) =>
    s.id !== "payment" &&
    s.id !== "review" &&
    s.id !== "images" &&
    s.id !== "branch",
);

export default function DirectEnrollmentModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: DirectEnrollmentModalProps) {
  // Steps: 1 = Select Course, 2 = Form Info, 3 = Payment Configuration, 4 = Review & Submit
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);

  // Selection
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form Details
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");

  // Submission
  const [submitting, setSubmitting] = useState(false);

  // Fetch Courses belonging to the Partner
  useEffect(() => {
    if (isOpen) {
      setLoadingCourses(true);
      fetch("/api/partner-portal/courses")
        .then((res) => {
          if (!res.ok) throw new Error("Failed to load courses");
          return res.json();
        })
        .then((data) => {
          setCourses(data || []);
        })
        .catch((err) => {
          console.error(err);
          toast.error("Could not fetch active courses");
        })
        .finally(() => {
          setLoadingCourses(false);
        });
    }
  }, [isOpen]);

  // Pre-fill form fields when member or selected course changes
  useEffect(() => {
    if (isOpen && member) {
      const formattedDob = member.dateOfBirth
        ? member.dateOfBirth.split("T")[0] || ""
        : "";
      const mapped: Record<string, string> = {
        name_en: member.fullNameEnglish || member.userName || "",
        name_bn: member.fullNameBangla || "",
        dob: formattedDob,
        mobile: member.phoneNumber || "",
        email: member.email || "",
        nid: member.nid || "",
        blood_group: member.bloodGroup || "",
        father_name: member.fatherName || "",
        mother_name: member.motherName || "",
        occupation: member.occupation || "Student",
        institution: member.institute || "",
        level_class: member.faculty || "",
        present_address: member.address || "",
        permanent_address: member.address || "",
        emergency_contact: member.emergencyPhone || member.phoneNumber || "",
        emergency_relation: "Emergency Contact",
        nationality: "Bangladeshi",
        religion: "Islam",
        roll_id: "N/A",
        father_occupation: "Service",
        mother_occupation: "Housewife",
        height: "5'6\"",
        weight: "60 kg",
        motive_first: "To learn karate and self-defense.",
        signature_date: new Date().toISOString().split("T")[0],
      };

      // Calculate age
      if (formattedDob) {
        try {
          const birthYear = new Date(formattedDob).getFullYear();
          const currentYear = new Date().getFullYear();
          mapped.age = String(currentYear - birthYear);
        } catch {}
      }

      setFormData(mapped);
      setPhotoFile(member.picture || null);
      setSignatureFile(null);
      setStep(1);
      setSelectedCourseId("");
      setSelectedCourse(null);
      setPaymentMethod("cash");
      setTransactionId("");
    }
  }, [isOpen, member]);

  // Handle Course Choice
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const course = courses.find((c) => c.id === courseId) || null;
    setSelectedCourse(course);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload =
    (type: "photo" | "signature") =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === "photo") {
          setPhotoFile(reader.result as string);
        } else {
          setSignatureFile(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: currency || "BDT",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const validateFormInfo = () => {
    const requiredFields = FORM_FIELDS.filter(
      (f) =>
        f.required &&
        f.section !== "payment" &&
        f.section !== "review" &&
        f.section !== "images" &&
        f.section !== "branch",
    );
    for (const field of requiredFields) {
      if (!formData[field.id]?.trim()) {
        toast.error(`"${field.label}" is required.`);
        return false;
      }
    }
    return true;
  };

  // Submit direct enrollment
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Upload signature if base64 (photo can use member.picture as fallback if unchanged)
      let finalPhotoUrl = member.picture;
      let finalSignatureUrl = "";

      const uploadImage = async (
        dataUrl: string,
        type: "photo" | "signature",
      ) => {
        const res = await fetch("/api/enrollments/upload-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dataUrl, type, courseId: selectedCourseId }),
        });
        if (!res.ok) {
          throw new Error(`Failed to upload ${type}`);
        }
        const { secureUrl } = await res.json();
        return secureUrl as string;
      };

      if (photoFile && photoFile.startsWith("data:")) {
        finalPhotoUrl = await uploadImage(photoFile, "photo");
      }
      if (signatureFile && signatureFile.startsWith("data:")) {
        finalSignatureUrl = await uploadImage(signatureFile, "signature");
      }

      // Merge upload links into studentInfo
      const studentInfo = {
        ...formData,
        profilePhotoUrl: finalPhotoUrl,
        signatureUrl: finalSignatureUrl || undefined,
        hasPhoto: !!finalPhotoUrl,
        hasSignature: !!finalSignatureUrl,
      };

      // 2. Submit Enrollment POST
      const res = await fetch("/api/partner-portal/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          courseId: selectedCourseId,
          studentInfo,
          paymentMethod,
          transactionId:
            paymentMethod !== "cash" && paymentMethod !== "waived"
              ? transactionId.trim()
              : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to complete enrollment");
      }

      const result = await res.json();
      if (result.billingWarning) toast.warning(result.billingWarning);
      else toast.success("Member enrolled in course successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(
        err instanceof Error ? err.message : "Failed to enroll member",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start justify-center p-4 sm:items-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl transform flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all dark:border-border dark:bg-card">
                {/* Header */}
                <div className="flex items-center justify-between border-b bg-muted px-6 py-4 dark:border-border dark:bg-background/50">
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <Dialog.Title className="text-lg font-bold text-foreground dark:text-gray-100">
                        Enroll Member to Course
                      </Dialog.Title>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">
                        Select a course and enter payment details to enroll{" "}
                        <span className="font-semibold text-foreground dark:text-gray-300">
                          {member.fullNameEnglish ||
                            member.userName ||
                            "this member"}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-between border-b bg-muted/50 px-6 py-3 text-xs font-semibold text-muted-foreground dark:border-border dark:bg-background/10 dark:text-gray-400">
                  <span
                    className={
                      step === 1 ? "text-blue-600 dark:text-blue-400" : ""
                    }
                  >
                    1. Select Course
                  </span>
                  <span
                    className={
                      step === 2 ? "text-blue-600 dark:text-blue-400" : ""
                    }
                  >
                    2. Confirm Member Details
                  </span>
                  <span
                    className={
                      step === 3 ? "text-blue-600 dark:text-blue-400" : ""
                    }
                  >
                    3. Payment Configuration
                  </span>
                  <span
                    className={
                      step === 4 ? "text-blue-600 dark:text-blue-400" : ""
                    }
                  >
                    4. Review & Submit
                  </span>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto bg-muted/20 p-6 dark:bg-background/5">
                  {/* Step 1: Select Course */}
                  {step === 1 && (
                    <div className="space-y-6">
                      {loadingCourses ? (
                        <div className="flex items-center justify-center py-12">
                          <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        </div>
                      ) : courses.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground dark:text-gray-400">
                          No active courses are available for your venue. Please
                          create a course first.
                        </p>
                      ) : (
                        <div className="mx-auto max-w-xl space-y-4">
                          <label className="block text-sm font-bold text-foreground dark:text-gray-300">
                            Available Dojo Courses *
                          </label>
                          <select
                            value={selectedCourseId}
                            onChange={(e) => handleCourseChange(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="">-- Choose a course --</option>
                            {courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          {selectedCourse && (
                            <div className="mt-6 space-y-3 rounded-xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                              <h4 className="font-bold text-blue-900 dark:text-blue-400">
                                {selectedCourse.name}
                              </h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground dark:text-gray-400">
                                    Admission Fee:
                                  </span>{" "}
                                  <strong className="text-foreground dark:text-gray-100">
                                    {formatCurrency(
                                      selectedCourse.admissionFee,
                                      selectedCourse.currency,
                                    )}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-muted-foreground dark:text-gray-400">
                                    Monthly Fee:
                                  </span>{" "}
                                  <strong className="text-foreground dark:text-gray-100">
                                    {formatCurrency(
                                      selectedCourse.monthlyFee,
                                      selectedCourse.currency,
                                    )}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Form Details */}
                  {step === 2 && (
                    <div className="space-y-8">
                      {visibleSections.map((section) => (
                        <div
                          key={section.id}
                          className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-border dark:bg-card"
                        >
                          <h3 className="flex items-center border-b pb-2 text-sm font-bold text-foreground dark:border-border dark:text-gray-100">
                            {section.title}{" "}
                            <span className="ml-1.5 text-xs text-gray-400 dark:text-gray-500">
                              ({section.titleBn})
                            </span>
                          </h3>
                          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                            {FORM_FIELDS.filter(
                              (f) => f.section === section.id,
                            ).map((field) => {
                              const value = formData[field.id] || "";
                              return (
                                <div key={field.id} className="space-y-1">
                                  <label className="flex items-center gap-0.5 text-xs font-semibold text-muted-foreground dark:text-gray-400">
                                    {field.label}
                                    {field.required && (
                                      <span className="text-red-500">*</span>
                                    )}
                                  </label>
                                  {field.type === "textarea" ? (
                                    <textarea
                                      value={value}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          field.id,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                      rows={2}
                                    />
                                  ) : field.type === "select" ? (
                                    <select
                                      value={value}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          field.id,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    >
                                      <option value="">Select...</option>
                                      {field.options?.map((opt) => (
                                        <option
                                          key={opt.value}
                                          value={opt.value}
                                        >
                                          {opt.label}
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type={field.type}
                                      value={value}
                                      onChange={(e) =>
                                        handleFieldChange(
                                          field.id,
                                          e.target.value,
                                        )
                                      }
                                      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Image Upload box */}
                      <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                        <h3 className="border-b pb-2 text-sm font-bold text-foreground dark:border-border dark:text-gray-100">
                          Profile Picture & Signature
                        </h3>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          {/* Profile photo */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground dark:text-gray-400">
                              Passport Photo
                            </label>
                            {photoFile && (
                              <div className="relative h-24 w-24 overflow-hidden rounded-lg border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={photoFile}
                                  alt="Profile Photo"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload("photo")}
                              className="w-full text-xs text-muted-foreground dark:text-gray-400"
                            />
                          </div>
                          {/* Signature photo */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground dark:text-gray-400">
                              Signature Image
                            </label>
                            {signatureFile && (
                              <div className="relative h-16 w-32 overflow-hidden rounded-lg border bg-muted">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={signatureFile}
                                  alt="Signature"
                                  className="h-full w-full object-contain"
                                />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload("signature")}
                              className="w-full text-xs text-muted-foreground dark:text-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {step === 3 && selectedCourse && (
                    <div className="mx-auto max-w-md space-y-6">
                      <div className="space-y-2 rounded-xl border border-gray-100 bg-muted p-4 dark:border-border dark:bg-background/30">
                        <h4 className="text-sm font-bold text-foreground dark:text-gray-300">
                          Enrollment Fees Due
                        </h4>
                        <div className="flex justify-between text-sm">
                          <span>Admission Fee:</span>
                          <span className="font-semibold text-foreground dark:text-gray-100">
                            {formatCurrency(
                              selectedCourse.admissionFee,
                              selectedCourse.currency,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>First Month Fee:</span>
                          <span className="font-semibold text-foreground dark:text-gray-100">
                            {formatCurrency(
                              selectedCourse.monthlyFee,
                              selectedCourse.currency,
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-foreground dark:text-gray-300">
                            Payment Channel *
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          >
                            <option value="cash">
                              Cash (Direct Hand-over)
                            </option>
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="rocket">Rocket</option>
                            <option value="waived">Waived (No Fee)</option>
                          </select>
                        </div>

                        {paymentMethod !== "cash" &&
                          paymentMethod !== "waived" && (
                            <div>
                              <label className="block text-sm font-bold text-foreground dark:text-gray-300">
                                Payment Transaction ID *
                              </label>
                              <input
                                type="text"
                                value={transactionId}
                                required
                                onChange={(e) =>
                                  setTransactionId(e.target.value)
                                }
                                placeholder="Enter Transaction ID"
                                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              />
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Review */}
                  {step === 4 && selectedCourse && (
                    <div className="mx-auto max-w-md space-y-6">
                      <div className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 space-y-2 rounded-xl border p-5 text-center">
                        <CheckIcon className="text-green-600 mx-auto h-8 w-8" />
                        <h4 className="text-green-950 dark:text-green-400 font-bold">
                          Ready to Enroll
                        </h4>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
                          Confirming the following will active the course
                          enrollment instantly.
                        </p>
                      </div>

                      <div className="divide-y text-sm dark:divide-gray-700">
                        <div className="flex justify-between py-2.5">
                          <span className="text-muted-foreground">
                            Student:
                          </span>
                          <span className="font-semibold">
                            {formData.name_en}
                          </span>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <span className="text-muted-foreground">
                            Selected Course:
                          </span>
                          <span className="font-semibold">
                            {selectedCourse.name}
                          </span>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <span className="text-muted-foreground">
                            Admission Charge:
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(
                              selectedCourse.admissionFee,
                              selectedCourse.currency,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <span className="text-muted-foreground">
                            Monthly Tuition:
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(
                              selectedCourse.monthlyFee,
                              selectedCourse.currency,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between py-2.5">
                          <span className="text-muted-foreground">
                            Payment Channel:
                          </span>
                          <span className="font-semibold uppercase">
                            {paymentMethod}
                          </span>
                        </div>
                        {paymentMethod !== "cash" &&
                          paymentMethod !== "waived" && (
                            <div className="flex justify-between py-2.5">
                              <span className="text-muted-foreground">
                                TxID:
                              </span>
                              <span className="font-mono text-xs">
                                {transactionId}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-between border-t bg-muted px-6 py-4 dark:border-border dark:bg-background/50">
                  <button
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1 || submitting}
                    className="inline-flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-gray-100 disabled:opacity-30 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <ChevronLeftIcon className="h-4 w-4" /> Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {step < 4 ? (
                      <button
                        onClick={() => {
                          if (step === 1 && !selectedCourseId) {
                            toast.error("Please select a course to continue.");
                            return;
                          }
                          if (step === 2 && !validateFormInfo()) {
                            return;
                          }
                          if (
                            step === 3 &&
                            paymentMethod !== "cash" &&
                            paymentMethod !== "waived" &&
                            !transactionId.trim()
                          ) {
                            toast.error("Transaction ID is required.");
                            return;
                          }
                          setStep((s) => s + 1);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                      >
                        Next <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-green-600 hover:bg-green-700 inline-flex items-center gap-1.5 rounded-lg px-6 py-2 text-sm font-bold text-white shadow-md transition-colors disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4" /> Complete
                            Enrollment
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
