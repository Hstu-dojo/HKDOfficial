"use client";

import { useState, useEffect } from "react";
import {
  XMarkIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
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

const actionLabels: Record<string, string> = {
  CREATE: "Create",
  READ: "View",
  UPDATE: "Edit",
  DELETE: "Delete",
  MANAGE: "Full access",
  APPROVE: "Approve",
  VERIFY: "Verify",
  ACCESS: "Access",
};
const actionDescriptions: Record<string, string> = {
  CREATE: "Add new records",
  READ: "View records",
  UPDATE: "Edit existing records",
  DELETE: "Delete records",
  MANAGE: "Includes every action for this resource",
  APPROVE: "Approve submissions",
  VERIFY: "Verify records or payments",
  ACCESS: "Enter this area",
};

export default function PermissionMatrix() {
  const [matrixData, setMatrixData] = useState<MatrixData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
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

  async function togglePermission(
    roleId: string,
    permissionId: string,
    hasPermission: boolean,
  ) {
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
                permissionIds: role.permissionIds.filter(
                  (id) => id !== permissionId,
                ),
                permissions: role.permissions.filter(
                  (p) => p.id !== permissionId,
                ),
              };
            } else {
              const permission = prev.permissions.find(
                (p) => p.id === permissionId,
              );
              return {
                ...role,
                permissionIds: [...role.permissionIds, permissionId],
                permissions: permission
                  ? [...role.permissions, permission]
                  : role.permissions,
              };
            }
          }),
        };
      });

      toast({
        title: "Success",
        description: hasPermission
          ? "Permission removed"
          : "Permission granted",
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

  async function grantAllPermissions(roleId: string, roleName: string) {
    if (!matrixData) return;

    if (
      !confirm(
        `Grant ALL permissions to ${roleName}? This will give this role full access.`,
      )
    ) {
      return;
    }

    setUpdating(`all-${roleId}`);
    let successCount = 0;
    let errorCount = 0;

    const role = matrixData.roles.find((r) => r.id === roleId);
    if (!role) return;

    const missingPermissions = matrixData.permissions.filter(
      (p) => !role.permissionIds.includes(p.id),
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
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !matrixData) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
        {error || "No data available"}
        <Button
          variant="outline"
          size="sm"
          className="ml-4"
          onClick={fetchMatrix}
        >
          Retry
        </Button>
      </div>
    );
  }

  const filteredResources = selectedResource
    ? [selectedResource]
    : matrixData.resources;

  return (
    <div className="portal-page space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <ShieldCheckIcon className="text-green-600 dark:text-green-400 h-6 w-6" />
            Role-Permission Matrix
          </h2>
          <p className="text-sm text-muted-foreground dark:text-gray-400">
            {matrixData.totalRoles} roles × {matrixData.totalPermissions}{" "}
            permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMatrix}
            disabled={loading}
          >
            <ArrowPathIcon
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/40 p-4 text-sm">
        <p>
          Each column is an action for the resource above it. Click a permission
          to grant or remove it.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-muted-foreground">
          <span className="inline-flex items-center gap-2">
            <CheckCircleSolid className="h-4 w-4 text-primary" /> Granted
          </span>
          <span className="inline-flex items-center gap-2">
            <XMarkIcon className="h-4 w-4" /> Not assigned
          </span>
          <span>
            <strong className="font-medium text-foreground">Full access</strong>{" "}
            includes every action for that resource.
          </span>
        </div>
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
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-muted dark:bg-card">
            <tr>
              <th
                rowSpan={2}
                scope="col"
                className="sticky left-0 z-10 min-w-[200px] bg-muted px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground dark:bg-card dark:text-gray-400"
              >
                Role
              </th>
              {filteredResources.map((resource) => {
                const perms = matrixData.permissionsByResource[resource] || [];
                return (
                  <th
                    key={resource}
                    colSpan={perms.length}
                    scope="colgroup"
                    className="border-l border-border px-2 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground dark:border-border dark:text-gray-400"
                  >
                    {resource.replace(/_/g, " ")}
                  </th>
                );
              })}
              <th
                rowSpan={2}
                scope="col"
                className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-gray-400"
              >
                Actions
              </th>
            </tr>
            <tr>
              {filteredResources.flatMap((resource) =>
                (matrixData.permissionsByResource[resource] || []).map(
                  (permission) => (
                    <th
                      key={permission.id}
                      scope="col"
                      className="min-w-[88px] border-l border-border px-3 py-3 text-center text-xs font-semibold text-foreground"
                      title={
                        actionDescriptions[permission.action] ||
                        permission.description ||
                        permission.action
                      }
                    >
                      {actionLabels[permission.action] || permission.action}
                    </th>
                  ),
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-card">
            {matrixData.roles
              .filter((r) => r.isActive)
              .map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-white px-4 py-3 dark:border-border dark:bg-card">
                    <div className="flex items-center gap-2">
                      <ShieldCheckIcon
                        className={`h-5 w-5 ${role.name === "SUPER_ADMIN" ? "text-yellow-500" : "text-green-600 dark:text-green-400"}`}
                      />
                      <div>
                        <div className="text-sm font-medium">{role.name}</div>
                        <div className="text-xs text-muted-foreground dark:text-gray-400">
                          {role.permissionIds.length} perms
                        </div>
                      </div>
                    </div>
                  </td>
                  {filteredResources.map((resource) => {
                    const perms =
                      matrixData.permissionsByResource[resource] || [];
                    return perms.map((permission) => {
                      const hasPermission = role.permissionIds.includes(
                        permission.id,
                      );
                      const isUpdating =
                        updating === `${role.id}-${permission.id}`;

                      return (
                        <td
                          key={permission.id}
                          className="border-l border-gray-100 px-1 py-2 text-center dark:border-gray-800"
                        >
                          <button
                            onClick={() =>
                              togglePermission(
                                role.id,
                                permission.id,
                                hasPermission,
                              )
                            }
                            disabled={updating !== null}
                            aria-pressed={hasPermission}
                            aria-label={`${role.name}: ${resource.replace(/_/g, " ")} — ${actionLabels[permission.action] || permission.action}, ${hasPermission ? "granted; click to remove" : "not assigned; click to grant"}`}
                            className={`mx-auto flex h-10 w-10 items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-60 ${hasPermission ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/20" : "border-border bg-background text-muted-foreground hover:bg-muted"}`}
                            title={`${hasPermission ? "Remove" : "Grant"} ${permission.name}`}
                          >
                            {isUpdating ? (
                              <ArrowPathIcon className="h-4 w-4 animate-spin text-muted-foreground dark:text-gray-400" />
                            ) : hasPermission ? (
                              <CheckCircleSolid className="h-5 w-5 text-primary" />
                            ) : (
                              <XMarkIcon className="h-5 w-5 text-muted-foreground" />
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
                        updating !== null ||
                        role.permissionIds.length ===
                          matrixData.totalPermissions
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {matrixData.roles
          .filter((r) => r.isActive)
          .map((role) => (
            <div
              key={role.id}
              className="rounded-lg border bg-white p-4 dark:bg-card"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheckIcon
                    className={`h-5 w-5 ${role.name === "SUPER_ADMIN" ? "text-yellow-500" : "text-green-600 dark:text-green-400"}`}
                  />
                  <span className="font-semibold">{role.name}</span>
                </div>
                <span className="text-sm text-muted-foreground dark:text-gray-400">
                  {role.permissionIds.length}/{matrixData.totalPermissions}
                </span>
              </div>
              {role.description && (
                <p className="mb-3 text-xs text-muted-foreground dark:text-gray-400">
                  {role.description}
                </p>
              )}
              <div className="flex flex-wrap gap-1">
                {Object.entries(
                  role.permissions.reduce(
                    (acc, p) => {
                      acc[p.resource] = (acc[p.resource] || 0) + 1;
                      return acc;
                    },
                    {} as Record<string, number>,
                  ),
                ).map(([resource, count]) => (
                  <span
                    key={resource}
                    className="rounded bg-muted px-2 py-0.5 text-xs dark:bg-gray-700"
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
