"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowPathIcon,
  QrCodeIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface PaymentAccount {
  id: string;
  name: string;
  methodType: 'bkash' | 'nagad' | 'rocket' | 'upay' | 'bank_transfer' | 'cash';
  accountNumber: string;
  accountName?: string | null;
  qrCodeUrl?: string | null;
  instructions?: string | null;
  scope: 'default' | 'program' | 'course' | 'enrollment' | 'monthly_fee' | 'event';
  scopeId?: string | null;
  scopeName?: string | null;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

interface Program {
  id: string;
  title: string;
}

interface Course {
  id: string;
  name: string;
}

const methodIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  bkash: DevicePhoneMobileIcon,
  nagad: DevicePhoneMobileIcon,
  rocket: DevicePhoneMobileIcon,
  upay: DevicePhoneMobileIcon,
  bank_transfer: BuildingLibraryIcon,
  cash: BanknotesIcon,
};

const methodColors: Record<string, string> = {
  bkash: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  nagad: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  rocket: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  upay: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  bank_transfer: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  cash: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

const scopeLabels: Record<string, string> = {
  default: "Default (All)",
  program: "Program",
  course: "Course",
  enrollment: "Enrollment",
  monthly_fee: "Monthly Fee",
  event: "Event",
};

export default function PaymentSettingsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<PaymentAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterScope, setFilterScope] = useState<string>("all");
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    methodType: "bkash" as PaymentAccount['methodType'],
    accountNumber: "",
    accountName: "",
    qrCodeUrl: "",
    instructions: "",
    scope: "default" as PaymentAccount['scope'],
    scopeId: "",
    priority: 0,
    isDefault: false,
    isActive: true,
  });

  async function fetchAccounts() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/payment-accounts");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load payment accounts", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchPrograms() {
    try {
      const res = await fetch("/api/programs");
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
      }
    } catch (error) {
      console.error("Failed to fetch programs:", error);
    }
  }

  async function fetchCourses() {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || data || []);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchAccounts();
    fetchPrograms();
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resetForm() {
    setFormData({
      name: "",
      methodType: "bkash",
      accountNumber: "",
      accountName: "",
      qrCodeUrl: "",
      instructions: "",
      scope: "default",
      scopeId: "",
      priority: 0,
      isDefault: false,
      isActive: true,
    });
    setEditingAccount(null);
    setShowForm(false);
  }

  function handleEdit(account: PaymentAccount) {
    setFormData({
      name: account.name,
      methodType: account.methodType,
      accountNumber: account.accountNumber,
      accountName: account.accountName || "",
      qrCodeUrl: account.qrCodeUrl || "",
      instructions: account.instructions || "",
      scope: account.scope,
      scopeId: account.scopeId || "",
      priority: account.priority,
      isDefault: account.isDefault,
      isActive: account.isActive,
    });
    setEditingAccount(account);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingAccount
        ? `/api/admin/payment-accounts/${editingAccount.id}`
        : "/api/admin/payment-accounts";
      const method = editingAccount ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast({
        title: "Success",
        description: editingAccount ? "Payment account updated" : "Payment account created",
      });

      resetForm();
      fetchAccounts();
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(accountId: string) {
    if (!confirm("Are you sure you want to delete this payment account?")) return;

    try {
      const res = await fetch(`/api/admin/payment-accounts/${accountId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast({ title: "Success", description: "Payment account deleted" });
      fetchAccounts();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete payment account", variant: "destructive" });
    }
  }

  async function handleToggleActive(account: PaymentAccount) {
    try {
      const res = await fetch(`/api/admin/payment-accounts/${account.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive }),
      });

      if (!res.ok) throw new Error("Failed to update");

      toast({
        title: "Success",
        description: account.isActive ? "Payment account deactivated" : "Payment account activated",
      });
      fetchAccounts();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update payment account", variant: "destructive" });
    }
  }

  const filteredAccounts = filterScope === "all"
    ? accounts
    : accounts.filter((a) => a.scope === filterScope);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BanknotesIcon className="h-7 w-7 text-green-600" />
            Payment Settings
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage bKash, Nagad, and other payment account numbers
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Add Payment Account
        </Button>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterScope === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterScope("all")}
        >
          All ({accounts.length})
        </Button>
        {Object.entries(scopeLabels).map(([scope, label]) => {
          const count = accounts.filter((a) => a.scope === scope).length;
          return (
            <Button
              key={scope}
              variant={filterScope === scope ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterScope(scope)}
            >
              {label} ({count})
            </Button>
          );
        })}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingAccount ? "Edit Payment Account" : "Add Payment Account"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Account Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent"
                  placeholder="e.g., Main bKash Account"
                  required
                />
              </div>

              {/* Method Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Payment Method *</label>
                <select
                  value={formData.methodType}
                  onChange={(e) => setFormData((f) => ({ ...f, methodType: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent"
                  required
                >
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="upay">Upay</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              {/* Account Number */}
              <div>
                <label className="block text-sm font-medium mb-1">Account Number *</label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData((f) => ({ ...f, accountNumber: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent"
                  placeholder="e.g., 01777-300309"
                  required
                />
              </div>

              {/* Account Holder Name */}
              <div>
                <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData((f) => ({ ...f, accountName: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent"
                  placeholder="Name shown on account (optional)"
                />
              </div>

              {/* Scope */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Scope *</label>
                  <select
                    value={formData.scope}
                    onChange={(e) => setFormData((f) => ({ ...f, scope: e.target.value as any, scopeId: "" }))}
                    className="w-full px-3 py-2 border rounded-lg bg-transparent"
                  >
                    <option value="default">Default (All)</option>
                    <option value="program">Specific Program</option>
                    <option value="course">Specific Course</option>
                    <option value="enrollment">Enrollment</option>
                    <option value="monthly_fee">Monthly Fees</option>
                    <option value="event">Events</option>
                  </select>
                </div>

                {/* Scope ID - only show for program/course */}
                {(formData.scope === "program" || formData.scope === "course") && (
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Select {formData.scope === "program" ? "Program" : "Course"}
                    </label>
                    <select
                      value={formData.scopeId}
                      onChange={(e) => setFormData((f) => ({ ...f, scopeId: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg bg-transparent"
                    >
                      <option value="">-- Select --</option>
                      {formData.scope === "program" &&
                        programs.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title}
                          </option>
                        ))}
                      {formData.scope === "course" &&
                        courses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* QR Code URL */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  <QrCodeIcon className="h-4 w-4 inline mr-1" />
                  QR Code URL
                </label>
                <input
                  type="url"
                  value={formData.qrCodeUrl}
                  onChange={(e) => setFormData((f) => ({ ...f, qrCodeUrl: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent"
                  placeholder="https://... (optional)"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm font-medium mb-1">Payment Instructions</label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData((f) => ({ ...f, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent"
                  rows={3}
                  placeholder="Instructions for users when making payment..."
                />
              </div>

              {/* Priority and Flags */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Priority</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData((f) => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border rounded-lg bg-transparent"
                    min={0}
                  />
                  <p className="text-xs text-gray-500 mt-1">Higher = shown first</p>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData((f) => ({ ...f, isDefault: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <label htmlFor="isDefault" className="text-sm">Set as Default</label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4"
                  />
                  <label htmlFor="isActive" className="text-sm">Active</label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : editingAccount ? (
                    "Update Account"
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Accounts List */}
      {filteredAccounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <BanknotesIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-4 text-lg font-medium">No payment accounts found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Add your first payment account to start accepting payments.
          </p>
          <Button onClick={() => setShowForm(true)} className="mt-4 gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Payment Account
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAccounts.map((account) => {
            const MethodIcon = methodIcons[account.methodType] || BanknotesIcon;
            return (
              <div
                key={account.id}
                className={`p-4 border rounded-lg bg-white dark:bg-gray-800 ${
                  !account.isActive ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${methodColors[account.methodType]}`}>
                      <MethodIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{account.name}</h3>
                      <p className="text-lg font-mono text-primary">{account.accountNumber}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {account.isDefault && (
                      <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </div>

                {account.accountName && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Account holder: {account.accountName}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${methodColors[account.methodType]}`}>
                    {account.methodType.toUpperCase()}
                  </span>
                  <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                    {scopeLabels[account.scope]}
                    {account.scopeName && `: ${account.scopeName}`}
                  </span>
                </div>

                {account.instructions && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
                    {account.instructions}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleToggleActive(account)}
                    className={`text-xs flex items-center gap-1 ${
                      account.isActive ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <CheckCircleIcon className="h-4 w-4" />
                    {account.isActive ? "Active" : "Inactive"}
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(account)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4 text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(account.id)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
