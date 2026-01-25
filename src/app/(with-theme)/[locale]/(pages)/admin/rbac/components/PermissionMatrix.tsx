"use client";

import { useState, useEffect } from "react";
import {
  CheckIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  KeyIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";
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
  permissions: Permission[];
  permissionIds: string[];
}

interface MatrixData {
  roles: Role[];
  permissions: Permission[];
  permissionsByResource: Record<string, Permission[]>;
  resources: string[];
  totalRoles: number;
  totalPermissions: number;
}

const actionColors: Record<string, string> = {
  CREATE: "bg-green-500",
  READ: "bg-blue-500",
  UPDATE: "bg-yellow-500",
  DELETE: "bg-red-500",
  MANAGE: "bg-purple-500",
  APPROVE: "bg-indigo-500",
  VERIFY: "bg-teal-500",
};

const actionLabels: Record<string, string> = {
  CREATE: "C",
  READ: "R",
  UPDATE: "U",
  DELETE: "D",
  MANAGE: "M",
  APPROVE: "A",
  VERIFY: "V",
};

export default function PermissionMatrix() {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const { toast } = useToast();

  async function fetchMatrix() {
    try {
      setLoading(true);
      const res = await fetch("/api/rbac/matrix");
      if (!res.ok) throw new Error("Failed to fetch matrix");
      const data = await res.json();
      setMatrixData(data);
      setError(null);
    } catch (err) {
      setError("Failed to load permission matrix");
      toast({
        title: "Error",
        description: "Failed to load permission matrix",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Initial fetch on mount
  useEffect(() => {
    fetchMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function togglePermission(roleId: string, permissionId: string, hasPermission: boolean) {
    const key = `${roleId}-${permissionId}`;
    setUpdating(key);
    
    try {
      const res = await fetch(`/api/rbac/roles/${roleId}/permissions`, {
        method: hasPermission ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update permission");
      }

      // Update local state
      setMatrixData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          roles: prev.roles.map((role) => {
            if (role.id !== roleId) return role;
            if (hasPermission) {
              return {
                ...role,
                permissionIds: role.permissionIds.filter((id) => id !== permissionId),
                permissions: role.permissions.filter((p) => p.id !== permissionId),
              };
            } else {
              const permission = prev.permissions.find((p) => p.id === permissionId);
              return {
                ...role,
                permissionIds: [...role.permissionIds, permissionId],
                permissions: permission ? [...role.permissions, permission] : role.permissions,
              };
            }
          }),
        };
      });

      toast({
        title: "Success",
        description: hasPermission ? "Permission removed" : "Permission granted",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  }

  async function handleSeedData() {
    if (!confirm("This will reseed all RBAC data. SUPER_ADMIN will get all permissions. Continue?")) {
      return;
    }
    
    setSeeding(true);
    try {
      const res = await fetch("/api/rbac/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!res.ok) throw new Error("Failed to seed data");
      
      toast({
        title: "Success",
        description: "RBAC data seeded successfully. SUPER_ADMIN now has all permissions.",
      });
      
      // Refresh matrix
      await fetchMatrix();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to seed RBAC data",
        variant: "destructive",
      });
    } finally {
      setSeeding(false);
    }
  }

  async function grantAllPermissions(roleId: string, roleName: string) {
    if (!matrixData) return;
    
    if (!confirm(`Grant ALL permissions to ${roleName}? This will give this role full access.`)) {
      return;
    }
    
    setUpdating(`all-${roleId}`);
    let successCount = 0;
    let errorCount = 0;
    
    const role = matrixData.roles.find((r) => r.id === roleId);
    if (!role) return;
    
    const missingPermissions = matrixData.permissions.filter(
      (p) => !role.permissionIds.includes(p.id)
    );
    
    for (const permission of missingPermissions) {
      try {
        const res = await fetch(`/api/rbac/roles/${roleId}/permissions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ permissionId: permission.id }),
        });
        if (res.ok) successCount++;
        else errorCount++;
      } catch {
        errorCount++;
      }
    }
    
    toast({
      title: "Bulk Assignment Complete",
      description: `${successCount} permissions granted, ${errorCount} failed`,
    });
    
    setUpdating(null);
    await fetchMatrix();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !matrixData) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
        {error || "No data available"}
        <Button variant="outline" size="sm" className="ml-4" onClick={fetchMatrix}>
          Retry
        </Button>
      </div>
    );
  }

  const filteredResources = selectedResource
    ? [selectedResource]
    : matrixData.resources;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            Role-Permission Matrix
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {matrixData.totalRoles} roles × {matrixData.totalPermissions} permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchMatrix} disabled={loading}>
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSeedData}
            disabled={seeding}
            className="bg-green-600 hover:bg-green-700"
          >
            {seeding ? (
              <>
                <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <KeyIcon className="h-4 w-4 mr-2" />
                Reseed RBAC Data
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <span className="text-sm font-medium">Actions:</span>
        {Object.entries(actionColors).map(([action, color]) => (
          <div key={action} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded ${color}`}></div>
            <span className="text-xs">{action}</span>
          </div>
        ))}
      </div>

      {/* Resource Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedResource === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedResource(null)}
        >
          All Resources
        </Button>
        {matrixData.resources.map((resource) => (
          <Button
            key={resource}
            variant={selectedResource === resource ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedResource(resource)}
          >
            {resource}
          </Button>
        ))}
      </div>

      {/* Matrix Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                Role
              </th>
              {filteredResources.map((resource) => {
                const perms = matrixData.permissionsByResource[resource] || [];
                return (
                  <th
                    key={resource}
                    colSpan={perms.length}
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-l border-gray-200 dark:border-gray-700"
                  >
                    {resource}
                    <div className="flex justify-center gap-1 mt-1">
                      {perms.map((p) => (
                        <span
                          key={p.id}
                          className={`w-5 h-5 rounded text-white text-[10px] flex items-center justify-center ${actionColors[p.action] || "bg-gray-500"}`}
                          title={p.action}
                        >
                          {actionLabels[p.action] || p.action[0]}
                        </span>
                      ))}
                    </div>
                  </th>
                );
              })}
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {matrixData.roles
              .filter((r) => r.isActive)
              .map((role) => (
                <tr key={role.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="sticky left-0 z-10 bg-white dark:bg-gray-900 px-4 py-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon
                        className={`h-5 w-5 ${role.name === "SUPER_ADMIN" ? "text-yellow-500" : "text-green-600"}`}
                      />
                      <div>
                        <div className="font-medium text-sm">{role.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {role.permissionIds.length} perms
                        </div>
                      </div>
                    </div>
                  </td>
                  {filteredResources.map((resource) => {
                    const perms = matrixData.permissionsByResource[resource] || [];
                    return perms.map((permission) => {
                      const hasPermission = role.permissionIds.includes(permission.id);
                      const isUpdating = updating === `${role.id}-${permission.id}`;
                      
                      return (
                        <td
                          key={permission.id}
                          className="px-1 py-2 text-center border-l border-gray-100 dark:border-gray-800"
                        >
                          <button
                            onClick={() => togglePermission(role.id, permission.id, hasPermission)}
                            disabled={isUpdating || updating === `all-${role.id}`}
                            className={`w-6 h-6 rounded flex items-center justify-center transition-all ${
                              isUpdating
                                ? "bg-gray-200 dark:bg-gray-700"
                                : hasPermission
                                ? "bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-800/50"
                                : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
                            }`}
                            title={`${hasPermission ? "Remove" : "Grant"} ${permission.name}`}
                          >
                            {isUpdating ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-500" />
                            ) : hasPermission ? (
                              <CheckCircleSolid className="h-4 w-4 text-green-600" />
                            ) : (
                              <XMarkIcon className="h-4 w-4 text-gray-400" />
                            )}
                          </button>
                        </td>
                      );
                    });
                  })}
                  <td className="px-4 py-2 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => grantAllPermissions(role.id, role.name)}
                      disabled={
                        updating === `all-${role.id}` ||
                        role.permissionIds.length === matrixData.totalPermissions
                      }
                      className="text-xs"
                    >
                      {updating === `all-${role.id}` ? (
                        <ArrowPathIcon className="h-3 w-3 animate-spin" />
                      ) : (
                        "Grant All"
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Role Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matrixData.roles
          .filter((r) => r.isActive)
          .map((role) => (
            <div
              key={role.id}
              className="p-4 border rounded-lg bg-white dark:bg-gray-800"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon
                    className={`h-5 w-5 ${role.name === "SUPER_ADMIN" ? "text-yellow-500" : "text-green-600"}`}
                  />
                  <span className="font-semibold">{role.name}</span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {role.permissionIds.length}/{matrixData.totalPermissions}
                </span>
              </div>
              {role.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {role.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {Object.entries(
                  role.permissions.reduce((acc, p) => {
                    acc[p.resource] = (acc[p.resource] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([resource, count]) => (
                  <span
                    key={resource}
                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded"
                  >
                    {resource}: {count}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
