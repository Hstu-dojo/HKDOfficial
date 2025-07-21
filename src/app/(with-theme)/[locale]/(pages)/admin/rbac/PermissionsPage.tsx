"use client";
import React, { useEffect, useState } from "react";

interface Permission {
  id: string;
  name: string;
  description?: string | null;
  resource: string;
  action: string;
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPermission, setNewPermission] = useState({
    name: "",
    description: "",
    resource: "USER",
    action: "READ"
  });
  const [creating, setCreating] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [selectedPermission, setSelectedPermission] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

  const resources = ["USER", "ACCOUNT", "SESSION", "PROVIDER", "ROLE", "PERMISSION", "COURSE", "BLOG", "MEDIA"];
  const actions = ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [permissionsRes, rolesRes] = await Promise.all([
        fetch("/api/rbac/permissions"),
        fetch("/api/rbac/roles")
      ]);
      
      const permissionsData = await permissionsRes.json();
      const rolesData = await rolesRes.json();
      
      setPermissions(permissionsData.permissions || []);
      setRoles(rolesData.roles || []);
    } catch (err) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreatePermission(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/rbac/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPermission),
      });
      if (!res.ok) throw new Error("Failed to create permission");
      setNewPermission({ name: "", description: "", resource: "USER", action: "READ" });
      fetchData();
    } catch (err) {
      setError("Failed to create permission");
    } finally {
      setCreating(false);
    }
  }

  async function handleAssignPermission(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole || !selectedPermission) return;
    
    setAssigning(true);
    setError(null);
    try {
      const res = await fetch(`/api/rbac/roles/${selectedRole}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId: selectedPermission }),
      });
      if (!res.ok) throw new Error("Failed to assign permission");
      setSelectedRole("");
      setSelectedPermission("");
      alert("Permission assigned successfully");
    } catch (err) {
      setError("Failed to assign permission");
    } finally {
      setAssigning(false);
    }
  }

  async function handleSeedData() {
    setError(null);
    try {
      const res = await fetch("/api/rbac/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to seed data");
      alert("RBAC data seeded successfully");
      fetchData();
    } catch (err) {
      setError("Failed to seed data");
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">RBAC Management</h1>
        <button
          onClick={handleSeedData}
          className="bg-green-600 text-red-700 px-4 py-2 rounded hover:bg-green-700"
        >
          Seed Default Data
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Create Permission */}
      <div className="p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Create Permission</h2>
        <form onSubmit={handleCreatePermission} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Permission name"
              value={newPermission.name}
              onChange={e => setNewPermission(p => ({ ...p, name: e.target.value }))}
              className="border px-3 py-2 rounded bg-transparent"
              required
            />
            <select
              value={newPermission.resource}
              onChange={e => setNewPermission(p => ({ ...p, resource: e.target.value }))}
              className="border px-3 py-2 rounded bg-transparent"
            >
              {resources.map(resource => (
                <option key={resource} value={resource}>{resource}</option>
              ))}
            </select>
            <select
              value={newPermission.action}
              onChange={e => setNewPermission(p => ({ ...p, action: e.target.value }))}
              className="border px-3 py-2 rounded bg-transparent"
            >
              {actions.map(action => (
                <option key={action} value={action}>{action}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
          <input
            type="text"
            placeholder="Description (optional)"
            value={newPermission.description}
            onChange={e => setNewPermission(p => ({ ...p, description: e.target.value }))}
            className="border px-3 py-2 rounded w-full bg-transparent"
          />
        </form>
      </div>

      {/* Assign Permission to Role */}
      <div className="p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Assign Permission to Role</h2>
        <form onSubmit={handleAssignPermission} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              className="border px-3 py-2 rounded bg-transparent"
              required
            >
              <option value="">Select Role</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
            <select
              value={selectedPermission}
              onChange={e => setSelectedPermission(e.target.value)}
              className="border px-3 py-2 rounded bg-transparent"
              required
            >
              <option value="">Select Permission</option>
              {permissions.map(permission => (
                <option key={permission.id} value={permission.id}>
                  {permission.name} ({permission.resource}:{permission.action})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={assigning}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
            >
              {assigning ? "Assigning..." : "Assign"}
            </button>
          </div>
        </form>
      </div>

      {/* Roles Table */}
      <div className="p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Roles ({roles.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="border-b">
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Description</th>
                <th className="border p-2 text-left">Active</th>
                <th className="border p-2 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="hover:bg-opacity-50">
                  <td className="border p-2 font-medium">{role.name}</td>
                  <td className="border p-2">{role.description || "-"}</td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      role.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {role.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="border p-2 text-sm opacity-70">
                    {new Date().toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="p-6 rounded-lg shadow border">
        <h2 className="text-xl font-semibold mb-4">Permissions ({permissions.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="border-b">
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Resource</th>
                <th className="border p-2 text-left">Action</th>
                <th className="border p-2 text-left">Description</th>
              </tr>
            </thead>
            <tbody>
              {permissions.map(permission => (
                <tr key={permission.id} className="hover:bg-opacity-50">
                  <td className="border p-2 font-medium">{permission.name}</td>
                  <td className="border p-2">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {permission.resource}
                    </span>
                  </td>
                  <td className="border p-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      permission.action === "MANAGE" ? "bg-purple-100 text-purple-800" :
                      permission.action === "CREATE" ? "bg-green-100 text-green-800" :
                      permission.action === "READ" ? "bg-gray-100 text-gray-800" :
                      permission.action === "UPDATE" ? "bg-yellow-100 text-yellow-800" :
                      permission.action === "DELETE" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {permission.action}
                    </span>
                  </td>
                  <td className="border p-2 text-sm opacity-70">
                    {permission.description || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
