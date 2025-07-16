"use client";
import React, { useEffect, useState } from "react";

interface Role {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, []);

  async function fetchRoles() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rbac/roles");
      const data = await res.json();
      setRoles(data.roles || []);
    } catch (err) {
      setError("Failed to load roles");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/rbac/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRole),
      });
      if (!res.ok) throw new Error("Failed to create role");
      setNewRole({ name: "", description: "" });
      fetchRoles();
    } catch (err) {
      setError("Failed to create role");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Roles Management</h1>
      <form onSubmit={handleCreateRole} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Role name"
          value={newRole.name}
          onChange={e => setNewRole(r => ({ ...r, name: e.target.value }))}
          className="border px-2 py-1 rounded bg-transparent"
          required
        />
        <input
          type="text"
          placeholder="Description"
          value={newRole.description}
          onChange={e => setNewRole(r => ({ ...r, description: e.target.value }))}
          className="border px-2 py-1 rounded bg-transparent"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700" disabled={creating}>
          {creating ? "Creating..." : "Add Role"}
        </button>
      </form>
      {loading ? (
        <div>Loading roles...</div>
      ) : error ? (
        <div className="text-red-600 bg-red-50 p-3 rounded border border-red-200">{error}</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-opacity-50">
                <th className="p-3 text-left font-semibold">Name</th>
                <th className="p-3 text-left font-semibold">Description</th>
                <th className="p-3 text-left font-semibold">Active</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="border-b hover:bg-opacity-50">
                  <td className="p-3 font-medium">{role.name}</td>
                  <td className="p-3 opacity-70">{role.description}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      role.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {role.isActive ? "Yes" : "No"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
