"use client";

import { useState, useEffect } from "react";
import { MagnifyingGlassIcon, PlusIcon, TrashIcon, UserIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface User {
  id: string;
  userName: string;
  email: string;
  userAvatar: string | null;
}

interface Role {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface UserWithRoles extends User {
  roles: Role[];
}

export default function UserRolesManagement() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/rbac/roles"),
      ]);

      if (!usersRes.ok || !rolesRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();

      setUsers(usersData.users || []);
      setAllRoles((rolesData.roles || []).filter((r: Role) => r.isActive));
    } catch (err) {
      setError("Failed to load data");
      toast({ title: "Error", description: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserRoles(userId: string) {
    try {
      const res = await fetch(`/api/rbac/users/${userId}/roles`);
      if (!res.ok) throw new Error("Failed to fetch user roles");
      const data = await res.json();
      return data.roles || [];
    } catch (err) {
      console.error("Error fetching user roles:", err);
      return [];
    }
  }

  async function handleSelectUser(user: UserWithRoles) {
    setSelectedUser(user);
    // Fetch fresh roles for this user
    const roles = await fetchUserRoles(user.id);
    setSelectedUser({ ...user, roles });
  }

  async function handleAssignRole(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUser || !selectedRoleId) return;

    setAssigning(true);
    try {
      const res = await fetch(`/api/rbac/users/${selectedUser.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to assign role");
      }

      toast({ title: "Success", description: "Role assigned successfully" });
      setSelectedRoleId("");
      
      // Refresh user roles
      const roles = await fetchUserRoles(selectedUser.id);
      setSelectedUser({ ...selectedUser, roles });
      
      // Update users list
      setUsers(users.map(u => 
        u.id === selectedUser.id ? { ...u, roles } : u
      ));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveRole(userId: string, roleId: string, roleName: string) {
    if (!confirm(`Remove role "${roleName}" from this user?`)) return;

    try {
      const res = await fetch(`/api/rbac/users/${userId}/roles`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to remove role");
      }

      toast({ title: "Success", description: "Role removed successfully" });
      
      // Refresh user roles
      if (selectedUser && selectedUser.id === userId) {
        const roles = await fetchUserRoles(userId);
        setSelectedUser({ ...selectedUser, roles });
      }
      
      // Update users list
      const roles = await fetchUserRoles(userId);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, roles } : u
      ));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  }

  const filteredUsers = users.filter((user) =>
    user.userName?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Get roles not yet assigned to selected user
  const availableRoles = selectedUser
    ? allRoles.filter((role) => !selectedUser.roles?.some((r) => r.id === role.id))
    : allRoles;

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
        <h2 className="text-xl font-semibold">User Roles Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Assign and manage roles for users
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Select User</h3>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="max-h-[500px] overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center gap-3 transition-colors ${
                  selectedUser?.id === user.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
                }`}
              >
                <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {user.userAvatar ? (
                    <img src={user.userAvatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.userName || "No name"}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                </div>
                {user.roles && user.roles.length > 0 && (
                  <div className="flex items-center gap-1">
                    <ShieldCheckIcon className="h-4 w-4 text-green-600" />
                    <span className="text-xs text-gray-500">{user.roles.length}</span>
                  </div>
                )}
              </button>
            ))}
            {filteredUsers.length === 0 && (
              <div className="px-4 py-8 text-center text-gray-500">
                No users found
              </div>
            )}
          </div>
        </div>

        {/* User Roles Panel */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border">
          {selectedUser ? (
            <>
              <div className="p-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {selectedUser.userAvatar ? (
                      <img src={selectedUser.userAvatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <UserIcon className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedUser.userName || "No name"}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUser.email}</p>
                  </div>
                </div>
              </div>

              {/* Assign Role Form */}
              <div className="p-4 border-b bg-gray-50 dark:bg-gray-700/50">
                <form onSubmit={handleAssignRole} className="flex gap-2">
                  <select
                    value={selectedRoleId}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
                    required
                  >
                    <option value="">Select role to assign...</option>
                    {availableRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name} {role.description ? `- ${role.description}` : ""}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" disabled={assigning || !selectedRoleId}>
                    <PlusIcon className="h-4 w-4 mr-1" />
                    {assigning ? "..." : "Assign"}
                  </Button>
                </form>
                {availableRoles.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    All available roles have been assigned to this user.
                  </p>
                )}
              </div>

              {/* Current Roles */}
              <div className="p-4">
                <h4 className="font-medium mb-3">Current Roles ({selectedUser.roles?.length || 0})</h4>
                {selectedUser.roles && selectedUser.roles.length > 0 ? (
                  <div className="space-y-2">
                    {selectedUser.roles.map((role) => (
                      <div
                        key={role.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                          <div>
                            <span className="font-medium">{role.name}</span>
                            {role.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveRole(selectedUser.id, role.id, role.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No roles assigned to this user
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <UserIcon className="h-12 w-12 mb-3 opacity-50" />
              <p>Select a user to manage their roles</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
