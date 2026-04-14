"use client";

import { useState, useEffect, useCallback } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentCheckIcon,
  EyeIcon,
  BanknotesIcon,
  UserIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import ApplicationDetailModal from "./ApplicationDetailModal";
import { format } from "date-fns";

interface Application {
  application: {
    id: string;
    applicationNumber: string;
    userId: string;
    courseId: string;
    studentInfo: {
      fullNameEnglish: string;
      fullNameBangla?: string;
      fatherName?: string;
      motherName?: string;
      dateOfBirth?: string;
      gender?: string;
      bloodGroup?: string;
      email: string;
      phoneNumber: string;
      emergencyContact?: string;
      address?: string;
      occupation?: string;
      institution?: string;
      previousMartialArtsExperience?: string;
      medicalConditions?: string;
      profilePhotoUrl?: string;
      nationalIdNumber?: string;
    };
    admissionFeeAmount: number;
    currency: string;
    status: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentProofUrl?: string;
    paymentSubmittedAt?: string;
    paymentVerifiedAt?: string;
    verifiedById?: string;
    reviewedAt?: string;
    reviewedById?: string;
    rejectionReason?: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
  };
  course: {
    id: string;
    name: string;
    monthlyFee: number;
    admissionFee: number;
  } | null;
  applicant: {
    id: string;
    email: string;
    userName: string;
  } | null;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    color: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  pending_payment: {
    label: "Pending Payment",
    color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700",
    icon: ClockIcon,
  },
  payment_submitted: {
    label: "Payment Submitted",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700",
    icon: BanknotesIcon,
  },
  payment_verified: {
    label: "Payment Verified",
    color: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700",
    icon: DocumentCheckIcon,
  },
  approved: {
    label: "Approved",
    color: "bg-green-100 dark:bg-green-900/30 text-green-700",
    icon: CheckCircleIcon,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 dark:bg-red-900/30 text-red-700",
    icon: XCircleIcon,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
    icon: XCircleIcon,
  },
};

export default function EnrollmentsManagement() {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  const [exporting, setExporting] = useState(false);

  const canVerify = hasPermission("ENROLLMENT", "VERIFY");
  const canApprove = hasPermission("ENROLLMENT", "APPROVE");

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const url = statusFilter
        ? `/api/admin/enrollments?status=${statusFilter}`
        : "/api/admin/enrollments";
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch applications");
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      toast.error("Failed to load applications");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    if (!rbacLoading) {
      fetchApplications();
    }
  }, [rbacLoading, fetchApplications]);

  const handleAction = async (
    applicationId: string,
    action: string,
    data?: Record<string, string>,
  ) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Action failed");
      }

      toast.success(`Application ${action.replace("_", " ")} successful`);
      fetchApplications();
      setSelectedApplication(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    }
  };

  const handleExport = async (filterStatus?: string) => {
    try {
      setExporting(true);
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);

      const response = await fetch(
        `/api/admin/enrollments/export?${params.toString()}`,
      );

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `enrollment-applications-${filterStatus || "all"}-${format(new Date(), "yyyy-MM-dd")}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export completed successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export applications");
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Stats
  const stats = {
    total: applications.length,
    pending_payment: applications.filter(
      (a) => a.application.status === "pending_payment",
    ).length,
    payment_submitted: applications.filter(
      (a) => a.application.status === "payment_submitted",
    ).length,
    payment_verified: applications.filter(
      (a) => a.application.status === "payment_verified",
    ).length,
    approved: applications.filter((a) => a.application.status === "approved")
      .length,
    rejected: applications.filter((a) => a.application.status === "rejected")
      .length,
  };

  if (rbacLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Enrollment Applications
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and manage student enrollment applications
          </p>
        </div>

        {/* Export Dropdown */}
        <div className="flex items-center gap-2">
          <div className="group relative">
            <button
              disabled={exporting}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ArrowDownTrayIcon className="mr-2 h-4 w-4" />
              {exporting ? "Exporting..." : "Export Excel"}
            </button>
            <div className="invisible absolute right-0 z-10 mt-1 w-48 rounded-lg border bg-white opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100 dark:bg-gray-800">
              <button
                onClick={() => handleExport()}
                className="w-full rounded-t-lg px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                All Applications
              </button>
              <button
                onClick={() => handleExport("approved")}
                className="text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 w-full px-4 py-2 text-left text-sm"
              >
                Approved Only
              </button>
              <button
                onClick={() => handleExport("pending_payment")}
                className="text-yellow-700 hover:bg-yellow-50 dark:bg-yellow-900/20 w-full px-4 py-2 text-left text-sm"
              >
                Pending Payment
              </button>
              <button
                onClick={() => handleExport("payment_submitted")}
                className="w-full px-4 py-2 text-left text-sm text-blue-700 hover:bg-blue-50"
              >
                Payment Submitted
              </button>
              <button
                onClick={() => handleExport("rejected")}
                className="w-full rounded-b-lg px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Rejected Only
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
        <button
          onClick={() => setStatusFilter("")}
          className={`rounded-lg border p-4 text-left ${
            statusFilter === "" ? "border-blue-500 ring-2 ring-blue-500" : ""
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">All</p>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </button>
        <button
          onClick={() => setStatusFilter("pending_payment")}
          className={`rounded-lg border p-4 text-left ${
            statusFilter === "pending_payment"
              ? "ring-yellow-500 border-yellow-500 ring-2"
              : ""
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pending Payment
          </p>
          <p className="text-yellow-600 text-2xl font-semibold">
            {stats.pending_payment}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter("payment_submitted")}
          className={`rounded-lg border p-4 text-left ${
            statusFilter === "payment_submitted"
              ? "border-blue-500 ring-2 ring-blue-500"
              : ""
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Payment Submitted
          </p>
          <p className="text-2xl font-semibold text-blue-600">
            {stats.payment_submitted}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter("payment_verified")}
          className={`rounded-lg border p-4 text-left ${
            statusFilter === "payment_verified"
              ? "border-indigo-500 ring-2 ring-indigo-500"
              : ""
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Payment Verified
          </p>
          <p className="text-2xl font-semibold text-indigo-600">
            {stats.payment_verified}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter("approved")}
          className={`rounded-lg border p-4 text-left ${
            statusFilter === "approved"
              ? "ring-green-500 border-green-500 ring-2"
              : ""
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
          <p className="text-green-600 dark:text-green-400 text-2xl font-semibold">
            {stats.approved}
          </p>
        </button>
        <button
          onClick={() => setStatusFilter("rejected")}
          className={`rounded-lg border p-4 text-left ${
            statusFilter === "rejected"
              ? "border-red-500 ring-2 ring-red-500"
              : ""
          }`}
        >
          <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
          <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
            {stats.rejected}
          </p>
        </button>
      </div>

      {/* Applications Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="py-12 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No applications
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {statusFilter
                ? `No ${statusFilter.replace("_", " ")} applications found.`
                : "No enrollment applications yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Application
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {applications.map((app) => {
                  const status = STATUS_CONFIG[app.application.status];
                  const StatusIcon = status?.icon || ClockIcon;

                  return (
                    <tr
                      key={app.application.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {app.application.applicationNumber}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          {app.application.studentInfo.profilePhotoUrl ? (
                            <img
                              src={app.application.studentInfo.profilePhotoUrl}
                              alt=""
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                              <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {app.application.studentInfo.fullNameEnglish}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {app.application.studentInfo.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {app.course?.name || "Unknown"}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatCurrency(
                            app.application.admissionFeeAmount,
                            app.application.currency,
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status?.color}`}
                        >
                          <StatusIcon className="mr-1 h-3.5 w-3.5" />
                          {status?.label || app.application.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(app.application.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedApplication(app)}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                            title="View Details"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          {app.application.status === "payment_submitted" &&
                            canVerify && (
                              <button
                                onClick={() =>
                                  handleAction(
                                    app.application.id,
                                    "verify_payment",
                                  )
                                }
                                className="rounded bg-blue-100 px-2 py-1 text-xs text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30"
                              >
                                Verify
                              </button>
                            )}
                          {app.application.status === "payment_verified" &&
                            canApprove && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction(app.application.id, "approve")
                                  }
                                  className="bg-green-100 dark:bg-green-900/30 text-green-700 hover:bg-green-200 rounded px-2 py-1 text-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt(
                                      "Enter rejection reason:",
                                    );
                                    if (reason) {
                                      handleAction(
                                        app.application.id,
                                        "reject",
                                        { rejectionReason: reason },
                                      );
                                    }
                                  }}
                                  className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}{" "}
      </div>

      {/* Application Detail Modal */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onAction={handleAction}
          canVerify={canVerify}
          canApprove={canApprove}
        />
      )}
    </div>
  );
}
