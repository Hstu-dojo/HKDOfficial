"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
  TrashIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import ApplicationDetailModal from "./ApplicationDetailModal";
import EnrollmentFormModal from "./EnrollmentFormModal";
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

interface EnrollmentRow {
  id: string;
  enrolledAt: string;
  startDate: string;
  monthlyFee: number;
  currency: string;
  isActive: boolean;
  completedAt: string | null;
  droppedAt: string | null;
  transactionId: string | null;
  paymentProofUrl: string | null;
  applicationId: string | null;
  memberName: string;
  memberNumber: string | null;
  memberPhone: string | null;
  memberEmail: string | null;
  courseName: string;
  courseId: string;
  profileId: string;
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
    color: "bg-gray-100 dark:bg-gray-750 text-gray-750 dark:text-gray-300",
    icon: XCircleIcon,
  },
};

export default function EnrollmentsManagement() {
  const { hasPermission, loading: rbacLoading } = useRBAC();
  
  // Tab states
  const [activeTab, setActiveTab] = useState<"applications" | "enrollments">("applications");
  
  // Filter & Search states
  const [partners, setPartners] = useState<any[]>([]);
  const [partnerFilter, setPartnerFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Applications tab states
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedApplication, setSelectedApplication] =
    useState<Application | null>(null);
  
  // Enrollments tab states
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [enrollmentStatusFilter, setEnrollmentStatusFilter] = useState<string>("active");

  // Shared form edit modal state
  const [selectedAppForFormModal, setSelectedAppForFormModal] = useState<{
    applicationId: string;
    courseId: string;
    courseName: string;
    studentInfo: any;
    status: string;
    paymentInfo?: any;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const canVerify = hasPermission("ENROLLMENT", "VERIFY");
  const canApprove = hasPermission("ENROLLMENT", "APPROVE");
  const canManage = hasPermission("ENROLLMENT", "MANAGE");

  // Fetch partners
  useEffect(() => {
    fetch("/api/admin/partners")
      .then((res) => res.json())
      .then((data) => {
        setPartners(data.partners || []);
      })
      .catch((err) => console.error("Error loading partners:", err));
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (partnerFilter) params.append("partnerId", partnerFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const response = await fetch(`/api/admin/enrollments?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch applications");
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      toast.error("Failed to load applications");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, partnerFilter, searchQuery]);

  const fetchEnrollments = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (enrollmentStatusFilter && enrollmentStatusFilter !== "all") {
        params.append("status", enrollmentStatusFilter);
      }
      if (partnerFilter) params.append("partnerId", partnerFilter);
      if (searchQuery.trim()) params.append("q", searchQuery.trim());

      const response = await fetch(`/api/admin/course-enrollments?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch enrollments");
      const data = await response.json();
      setEnrollments(data);
    } catch (error) {
      toast.error("Failed to load enrollments");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [enrollmentStatusFilter, partnerFilter, searchQuery]);

  useEffect(() => {
    if (!rbacLoading) {
      if (activeTab === "applications") {
        fetchApplications();
      } else {
        fetchEnrollments();
      }
    }
  }, [rbacLoading, activeTab, fetchApplications, fetchEnrollments]);

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

  const handleSaveForm = async (updatedInfo: any) => {
    if (!selectedAppForFormModal) return;
    const response = await fetch(`/api/admin/enrollments/${selectedAppForFormModal.applicationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update_info", studentInfo: updatedInfo }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to save updates");
    }

    toast.success("Student details updated successfully");
    
    // Refresh tables
    if (activeTab === "applications") {
      fetchApplications();
    } else {
      fetchEnrollments();
    }

    // Keep modal state updated
    setSelectedAppForFormModal((prev) =>
      prev ? { ...prev, studentInfo: updatedInfo } : null
    );
  };

  const handleDropEnrollment = async (enrollmentId: string) => {
    const reason = prompt("Drop reason (optional):") || "";
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/course-enrollments`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, action: "drop", dropReason: reason || null }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to drop enrollment");
      }

      toast.success("Enrollment dropped successfully");
      fetchEnrollments();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action failed");
    } finally {
      setLoading(false);
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
            {activeTab === "applications" ? "Enrollment Applications" : "Active Enrollments"}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {activeTab === "applications"
              ? "Review and manage student enrollment applications"
              : "Search, filter, view, and drop active course enrollments"}
          </p>
        </div>

        {/* Export Dropdown - only for applications */}
        {activeTab === "applications" && (
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
        )}
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setActiveTab("applications");
            setLoading(true);
          }}
          className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "applications"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Applications
        </button>
        <button
          onClick={() => {
            setActiveTab("enrollments");
            setLoading(true);
          }}
          className={`py-2.5 px-5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === "enrollments"
              ? "border-blue-500 text-blue-600 dark:text-blue-400 font-bold"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Active Enrollments
        </button>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex-1">
          <label htmlFor="search-q" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Search Student
          </label>
          <input
            id="search-q"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, email, member number, txn ID..."
            className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-64">
          <label htmlFor="filter-partner" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
            Organization (Partner)
          </label>
          <select
            id="filter-partner"
            value={partnerFilter}
            onChange={(e) => setPartnerFilter(e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
          >
            <option value="">All Organizations</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        {activeTab === "applications" ? (
          <div className="w-full sm:w-56">
            <label htmlFor="filter-status-app" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Application Status
            </label>
            <select
              id="filter-status-app"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="pending_payment">Pending Payment</option>
              <option value="payment_submitted">Payment Submitted</option>
              <option value="payment_verified">Payment Verified</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        ) : (
          <div className="w-full sm:w-56">
            <label htmlFor="filter-status-en" className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              Enrollment Status
            </label>
            <select
              id="filter-status-en"
              value={enrollmentStatusFilter}
              onChange={(e) => setEnrollmentStatusFilter(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="dropped">Dropped</option>
              <option value="all">All</option>
            </select>
          </div>
        )}
      </div>

      {/* Stats - only for Applications tab */}
      {activeTab === "applications" && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
          <button
            onClick={() => setStatusFilter("")}
            className={`rounded-lg border p-4 text-left bg-white dark:bg-gray-800 shadow-sm ${
              statusFilter === "" ? "border-blue-500 ring-2 ring-blue-500" : "dark:border-gray-700"
            }`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">All</p>
            <p className="text-2xl font-semibold">{stats.total}</p>
          </button>
          <button
            onClick={() => setStatusFilter("pending_payment")}
            className={`rounded-lg border p-4 text-left bg-white dark:bg-gray-800 shadow-sm ${
              statusFilter === "pending_payment"
                ? "ring-yellow-500 border-yellow-500 ring-2"
                : "dark:border-gray-700"
            }`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending Payment</p>
            <p className="text-yellow-600 text-2xl font-semibold">{stats.pending_payment}</p>
          </button>
          <button
            onClick={() => setStatusFilter("payment_submitted")}
            className={`rounded-lg border p-4 text-left bg-white dark:bg-gray-800 shadow-sm ${
              statusFilter === "payment_submitted"
                ? "border-blue-500 ring-2 ring-blue-500"
                : "dark:border-gray-700"
            }`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">Payment Submitted</p>
            <p className="text-2xl font-semibold text-blue-600">{stats.payment_submitted}</p>
          </button>
          <button
            onClick={() => setStatusFilter("payment_verified")}
            className={`rounded-lg border p-4 text-left bg-white dark:bg-gray-800 shadow-sm ${
              statusFilter === "payment_verified"
                ? "border-indigo-500 ring-2 ring-indigo-500"
                : "dark:border-gray-700"
            }`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">Payment Verified</p>
            <p className="text-2xl font-semibold text-indigo-600">{stats.payment_verified}</p>
          </button>
          <button
            onClick={() => setStatusFilter("approved")}
            className={`rounded-lg border p-4 text-left bg-white dark:bg-gray-800 shadow-sm ${
              statusFilter === "approved"
                ? "ring-green-500 border-green-500 ring-2"
                : "dark:border-gray-700"
            }`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">Approved</p>
            <p className="text-green-600 dark:text-green-400 text-2xl font-semibold">{stats.approved}</p>
          </button>
          <button
            onClick={() => setStatusFilter("rejected")}
            className={`rounded-lg border p-4 text-left bg-white dark:bg-gray-800 shadow-sm ${
              statusFilter === "rejected"
                ? "border-red-500 ring-2 ring-red-500"
                : "dark:border-gray-700"
            }`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p>
            <p className="text-2xl font-semibold text-red-600 dark:text-red-400">{stats.rejected}</p>
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-hidden rounded-lg border bg-white shadow-sm dark:bg-gray-800 dark:border-gray-700">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500"></div>
          </div>
        ) : activeTab === "applications" ? (
          applications.length === 0 ? (
            <div className="py-12 text-center">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No applications</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {statusFilter || partnerFilter || searchQuery
                  ? "No matching enrollment applications found."
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
                      Student Details
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
                      Payment
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
                      <tr key={app.application.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {app.application.applicationNumber}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            {app.application.studentInfo.profilePhotoUrl ? (
                              <div className="relative h-8 w-8 overflow-hidden rounded-full">
                                <Image
                                  src={app.application.studentInfo.profilePhotoUrl}
                                  alt=""
                                  fill
                                  unoptimized
                                  sizes="32px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                                <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              </div>
                            )}
                            <div className="ml-3">
                              <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                {app.application.studentInfo.fullNameEnglish || app.application.studentInfo.fullNameEnglish}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {app.application.studentInfo.email}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {app.application.studentInfo.phoneNumber}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{app.course?.name || "Unknown"}</div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {formatCurrency(app.application.admissionFeeAmount, app.application.currency)}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${status?.color}`}>
                            <StatusIcon className="mr-1 h-3.5 w-3.5" />
                            {status?.label || app.application.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-xs font-semibold text-gray-900 dark:text-gray-100 capitalize">
                            {app.application.paymentMethod || "—"}
                          </div>
                          <div className="text-xs font-mono text-gray-500 dark:text-gray-400">
                            {app.application.transactionId || "—"}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(app.application.createdAt)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex justify-end gap-2 items-center">
                            <button
                              onClick={() => setSelectedApplication(app)}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                              title="Review / Approve"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() =>
                                setSelectedAppForFormModal({
                                  applicationId: app.application.id,
                                  courseId: app.application.courseId,
                                  courseName: app.course?.name || "Course",
                                  studentInfo: app.application.studentInfo,
                                  status: app.application.status,
                                  paymentInfo: {
                                    method: app.application.paymentMethod,
                                    transactionId: app.application.transactionId,
                                    proofUrl: app.application.paymentProofUrl,
                                    amount: app.application.admissionFeeAmount,
                                    currency: app.application.currency,
                                  },
                                })
                              }
                              className="rounded p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/20"
                              title="View/Edit Form Fields"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            {app.application.status === "payment_submitted" && canVerify && (
                              <button
                                onClick={() => handleAction(app.application.id, "verify_payment")}
                                className="rounded bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                              >
                                Verify
                              </button>
                            )}
                            {app.application.status === "payment_verified" && canApprove && (
                              <>
                                <button
                                  onClick={() => handleAction(app.application.id, "approve")}
                                  className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 rounded px-2.5 py-1 text-xs font-semibold"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt("Enter rejection reason:");
                                    if (reason) {
                                      handleAction(app.application.id, "reject", { rejectionReason: reason });
                                    }
                                  }}
                                  className="rounded bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300"
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
          )
        ) : enrollments.length === 0 ? (
          <div className="py-12 text-center">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No enrollments</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {partnerFilter || searchQuery
                ? "No matching student enrollments found."
                : "No student enrollments yet."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Course Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Enrolled Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Monthly Fee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                {enrollments.map((en) => {
                  return (
                    <tr key={en.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600">
                            <UserIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">{en.memberName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {en.memberNumber || "—"} · {en.memberPhone || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">{en.courseName}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(en.enrolledAt)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(en.monthlyFee, en.currency)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            en.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : en.droppedAt
                              ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {en.isActive ? "Active" : en.droppedAt ? "Dropped" : "Completed"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                        <div className="flex justify-end gap-2 items-center">
                          {en.applicationId ? (
                            <button
                              onClick={() =>
                                setSelectedAppForFormModal({
                                  applicationId: en.applicationId!,
                                  courseId: en.courseId,
                                  courseName: en.courseName,
                                  studentInfo: null, // lazy load
                                  status: en.isActive ? "active" : en.droppedAt ? "dropped" : "completed",
                                  paymentInfo: {
                                    transactionId: en.transactionId,
                                    proofUrl: en.paymentProofUrl,
                                    amount: en.monthlyFee,
                                    currency: en.currency,
                                  },
                                })
                              }
                              className="rounded p-1 text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-700"
                              title="View Form Data"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                          ) : null}
                          {en.isActive && canManage && (
                            <button
                              onClick={() => handleDropEnrollment(en.id)}
                              className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/20"
                              title="Drop Enrollment"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Application Detail Modal - for review and approval */}
      {selectedApplication && (
        <ApplicationDetailModal
          application={selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onAction={handleAction}
          canVerify={canVerify}
          canApprove={canApprove}
        />
      )}

      {/* Shared form view/edit modal */}
      {selectedAppForFormModal && (
        <EnrollmentFormModal
          isOpen={true}
          onClose={() => setSelectedAppForFormModal(null)}
          applicationId={selectedAppForFormModal.applicationId}
          courseId={selectedAppForFormModal.courseId}
          courseName={selectedAppForFormModal.courseName}
          initialStudentInfo={selectedAppForFormModal.studentInfo}
          status={selectedAppForFormModal.status}
          onSave={handleSaveForm}
          paymentInfo={selectedAppForFormModal.paymentInfo}
        />
      )}
    </div>
  );
}
