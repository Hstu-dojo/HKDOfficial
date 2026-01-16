"use client";

import { useState, useEffect } from "react";
import { PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
  createdAt: string;
}

const RESOURCES = [
  "USER", "ACCOUNT", "SESSION", "PROVIDER", "ROLE", "PERMISSION",
  "COURSE", "BLOG", "MEDIA", "GALLERY", "CLASS", "EQUIPMENT", 
  "MEMBER", "BILL", "PAYMENT", "LEVEL", "VERIFICATION_TOKEN"
];

const ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"];

export default function PermissionsManagement() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    resource: "USER",
    action: "READ",
  });
  const [submitting, setSubmitting] = useState(false);
  const [filterResource, setFilterResource] = useState<string>("");
  const [filterAction, setFilterAction] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPermissions();
  }, []);

  async function fetchPermissions() {
    try {
      setLoading(true);
      const res = await fetch("/api/rbac/permissions");
      if (!res.ok) throw new Error("Failed to fetch permissions");
      const data = await res.json();
      setPermissions(data.permissions || []);
    } catch (err) {
      setError("Failed to load permissions");
      toast({ title: "Error", description: "Failed to load permissions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/rbac/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create permission");
      }

      toast({ title: "Success", description: "Permission created successfully" });
      setFormData({ name: "", description: "", resource: "USER", action: "READ" });
      setShowCreateForm(false);
      fetchPermissions();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPermission || !formData.name.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/rbac/permissions/${editingPermission.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update permission");
      }

      toast({ title: "Success", description: "Permission updated successfully" });
      setEditingPermission(null);
      setFormData({ name: "", description: "", resource: "USER", action: "READ" });
      fetchPermissions();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(permissionId: string, permissionName: string) {
    if (!confirm(`Are you sure you want to delete "${permissionName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/rbac/permissions/${permissionId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete permission");
      }

      toast({ title: "Success", description: "Permission deleted successfully" });
      fetchPermissions();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  function startEdit(permission: Permission) {
    setEditingPermission(permission);
    setFormData({
      name: permission.name,
      description: permission.description || "",
      resource: permission.resource,
      action: permission.action,
    });
    setShowCreateForm(false);
  }

  function cancelEdit() {
    setEditingPermission(null);
    setFormData({ name: "", description: "", resource: "USER", action: "READ" });
  }

  // Auto-generate permission name based on resource and action
  function generatePermissionName(resource: string, action: string) {
    return `${resource}_${action}`;
  }

  function handleResourceActionChange(field: "resource" | "action", value: string) {
    const newFormData = { ...formData, [field]: value };
    // Auto-update name if it matches the pattern or is empty
    const currentExpectedName = generatePermissionName(formData.resource, formData.action);
    if (formData.name === "" || formData.name === currentExpectedName) {
      newFormData.name = generatePermissionName(
        field === "resource" ? value : formData.resource,
        field === "action" ? value : formData.action
      );
    }
    setFormData(newFormData);
  }

  const filteredPermissions = permissions.filter((p) => {
    if (filterResource && p.resource !== filterResource) return false;
    if (filterAction && p.action !== filterAction) return false;
    return true;
  });

  // Group permissions by resource
  const groupedPermissions = filteredPermissions.reduce((acc, p) => {
    if (!acc[p.resource]) acc[p.resource] = [];
    acc[p.resource].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const actionColors: Record<string, string> = {
    CREATE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    READ: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
    UPDATE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    MANAGE: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Permissions Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Define granular permissions for resources and actions
          </p>
        </div>
        {!showCreateForm && !editingPermission && (
          <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            Create Permission
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Create/Edit Form */}
      {(showCreateForm || editingPermission) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
          <h3 className="font-semibold mb-4">
            {editingPermission ? `Edit: ${editingPermission.name}` : "Create New Permission"}
          </h3>
          <form onSubmit={editingPermission ? handleUpdate : handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Resource *</label>
                <select
                  value={formData.resource}
                  onChange={(e) => handleResourceActionChange("resource", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  {RESOURCES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Action *</label>
                <select
                  value={formData.action}
                  onChange={(e) => handleResourceActionChange("action", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                >
                  {ACTIONS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Permission Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., GALLERY_CREATE"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : editingPermission ? "Update" : "Create"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  cancelEdit();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Resource</label>
          <select
            value={filterResource}
            onChange={(e) => setFilterResource(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
          >
            <option value="">All Resources</option>
            {RESOURCES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Filter by Action</label>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
          >
            <option value="">All Actions</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Permissions by Resource */}
      <div className="space-y-4">
        {Object.entries(groupedPermissions).map(([resource, perms]) => (
          <div key={resource} className="bg-white dark:bg-gray-800 rounded-lg border overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 border-b">
              <h3 className="font-semibold flex items-center gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded text-sm">
                  {resource}
                </span>
                <span className="text-sm font-normal text-gray-500">
                  ({perms.length} permissions)
                </span>
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {perms.map((permission) => (
                <div
                  key={permission.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${actionColors[permission.action]}`}>
                      {permission.action}
                    </span>
                    <div>
                      <span className="font-medium">{permission.name}</span>
                      {permission.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {permission.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEdit(permission)}
                      className="h-8 w-8 p-0"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(permission.id, permission.name)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {Object.keys(groupedPermissions).length === 0 && (
          <div className="text-center py-8 text-gray-500 bg-white dark:bg-gray-800 rounded-lg border">
            No permissions found. Create your first permission to get started.
          </div>
        )}
      </div>
    </div>
  );
}
