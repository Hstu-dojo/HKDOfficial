"use client";

import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, ShieldCheckIcon, KeyIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface RolePermission {
  id: string;
  roleId: string;
  permissionId: string;
  permission: Permission;
}

export default function RolePermissionsManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Record<string, Permission[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissionId, setSelectedPermissionId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [rolesRes, permissionsRes] = await Promise.all([
        fetch("/api/rbac/roles"),
        fetch("/api/rbac/permissions"),
      ]);

      if (!rolesRes.ok || !permissionsRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const rolesData = await rolesRes.json();
      const permissionsData = await permissionsRes.json();

      setRoles(rolesData.roles || []);
      setPermissions(permissionsData.permissions || []);
    } catch (err) {
      setError("Failed to load data");
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchRolePermissions(roleId: string) {
    try {
      const res = await fetch(`/api/rbac/roles/${roleId}/permissions`);
      if (!res.ok) throw new Error("Failed to fetch role permissions");
      const data = await res.json();
      return data.permissions || [];
    } catch (err) {
      console.error("Error fetching role permissions:", err);
      return [];
    }
  }

  async function handleSelectRole(role: Role) {
    setSelectedRole(role);
    setBulkMode(false);
    setSelectedPermissions(new Set());
    
    // Fetch permissions for this role
    const perms = await fetchRolePermissions(role.id);
    setRolePermissions((prev) => ({ ...prev, [role.id]: perms }));
  }

  async function handleAssignPermission(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole || !selectedPermissionId) return;

    setAssigning(true);
    try {
      const res = await fetch(`/api/rbac/roles/${selectedRole.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId: selectedPermissionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign permission");
      }

      toast({ title: "Success", description: "Permission assigned successfully" });
      setSelectedPermissionId("");
      
      // Refresh role permissions
      const perms = await fetchRolePermissions(selectedRole.id);
      setRolePermissions((prev) => ({ ...prev, [selectedRole.id]: perms }));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  }

  async function handleBulkAssign() {
    if (!selectedRole || selectedPermissions.size === 0) return;

    setAssigning(true);
    let successCount = 0;
    let errorCount = 0;

    for (const permissionId of selectedPermissions) {
      try {
        const res = await fetch(`/api/rbac/roles/${selectedRole.id}/permissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionId }),
        });

        if (res.ok) {
          successCount++;
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }
    }

    toast({
      title: "Bulk Assignment Complete",
      description: `${successCount} permissions assigned, ${errorCount} failed`,
    });

    setSelectedPermissions(new Set());
    setBulkMode(false);
    
    // Refresh role permissions
    const perms = await fetchRolePermissions(selectedRole.id);
    setRolePermissions((prev) => ({ ...prev, [selectedRole.id]: perms }));
    setAssigning(false);
  }

  async function handleRemovePermission(roleId: string, permissionId: string, permissionName: string) {
    if (!confirm(`Remove permission "${permissionName}" from this role?`)) return;

    try {
      const res = await fetch(`/api/rbac/roles/${roleId}/permissions`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove permission");
      }

      toast({ title: "Success", description: "Permission removed successfully" });
      
      // Refresh role permissions
      const perms = await fetchRolePermissions(roleId);
      setRolePermissions((prev) => ({ ...prev, [roleId]: perms }));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  function togglePermissionSelection(permissionId: string) {
    const newSet = new Set(selectedPermissions);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissions(newSet);
  }

  // Get permissions not yet assigned to selected role
  const currentRolePermissions = selectedRole ? (rolePermissions[selectedRole.id] || []) : [];
  const availablePermissions = selectedRole
    ? permissions.filter((p) => !currentRolePermissions.some((rp) => rp.id === p.id))
    : permissions;

  // Group available permissions by resource
  const groupedAvailable = availablePermissions.reduce((acc, p) => {
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
      <div>
        <h2 className="text-xl font-semibold">Role Permissions Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Assign permissions to roles to define access levels
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Select Role</h3>
          </div>
          <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
            {roles.filter(r => r.isActive).map((role) => (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors ${
                  selectedRole?.id === role.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">{role.name}</p>
                  {role.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {role.description}
                    </p>
                  )}
                </div>
                {rolePermissions[role.id] && (
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {rolePermissions[role.id].length} perms
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Role Permissions Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border">
          {selectedRole ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldCheckIcon className="h-6 w-6 text-green-600" />
                  <div>
                    <h3 className="font-semibold">{selectedRole.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedRole.description || "No description"}
                    </p>
                  </div>
                </div>
                <Button
                  variant={bulkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkMode(!bulkMode)}
                >
                  {bulkMode ? "Cancel Bulk" : "Bulk Assign"}
                </Button>
              </div>

              {/* Assign Permission Form */}
              {!bulkMode && (
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-700/50">
                  <form onSubmit={handleAssignPermission} className="flex gap-2">
                    <select
                      value={selectedPermissionId}
                      onChange={(e) => setSelectedPermissionId(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                      required
                    >
                      <option value="">Select permission to assign...</option>
                      {Object.entries(groupedAvailable).map(([resource, perms]) => (
                        <optgroup key={resource} label={resource}>
                          {perms.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.action}: {p.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <Button type="submit" disabled={assigning || !selectedPermissionId}>
                      <PlusIcon className="h-4 w-4 mr-1" />
                      {assigning ? "..." : "Assign"}
                    </Button>
                  </form>
                </div>
              )}

              {/* Bulk Mode */}
              {bulkMode && (
                <div className="p-4 border-b bg-blue-50 dark:bg-blue-900/20">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-medium">
                      Select permissions to assign ({selectedPermissions.size} selected)
                    </p>
                    <Button
                      onClick={handleBulkAssign}
                      disabled={assigning || selectedPermissions.size === 0}
                      size="sm"
                    >
                      {assigning ? "Assigning..." : `Assign ${selectedPermissions.size} Permissions`}
                    </Button>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto space-y-2">
                    {Object.entries(groupedAvailable).map(([resource, perms]) => (
                      <div key={resource} className="space-y-1">
                        <p className="text-xs font-semibold text-gray-500 uppercase">{resource}</p>
                        <div className="flex flex-wrap gap-1">
                          {perms.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => togglePermissionSelection(p.id)}
                              className={`px-2 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
                                selectedPermissions.has(p.id)
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                              }`}
                            >
                              {selectedPermissions.has(p.id) && <CheckIcon className="h-3 w-3" />}
                              {p.action}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Current Permissions */}
              <div className="p-4">
                <h4 className="font-medium mb-3">
                  Current Permissions ({currentRolePermissions.length})
                </h4>
                {currentRolePermissions.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {/* Group by resource */}
                    {Object.entries(
                      currentRolePermissions.reduce((acc, p) => {
                        if (!acc[p.resource]) acc[p.resource] = [];
                        acc[p.resource].push(p);
                        return acc;
                      }, {} as Record<string, Permission[]>)
                    ).map(([resource, perms]) => (
                      <div key={resource} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                        <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                          {resource}
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {perms.map((permission) => (
                            <div
                              key={permission.id}
                              className={`inline-flex items-center gap-2 px-2 py-1 rounded text-sm ${actionColors[permission.action]}`}
                            >
                              <KeyIcon className="h-3 w-3" />
                              <span>{permission.action}</span>
                              <button
                                onClick={() =>
                                  handleRemovePermission(selectedRole.id, permission.id, permission.name)
                                }
                                className="ml-1 hover:text-red-600 transition-colors"
                              >
                                <TrashIcon className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No permissions assigned to this role
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <ShieldCheckIcon className="h-12 w-12 mb-3 opacity-50" />
              <p>Select a role to manage its permissions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
