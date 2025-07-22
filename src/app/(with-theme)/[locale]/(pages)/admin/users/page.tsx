"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRBAC } from "@/hooks/useRBAC";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface User {
  id: string;
  userName: string;
  email: string;
  userAvatar: string;
  emailVerified: boolean;
  createdAt: string;
  defaultRole: string;
  roles: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

interface UserFilters {
  search: string;
  role: string;
  status: string;
}

export default function UsersPage() {
  const { hasPermission, hasRole } = useRBAC();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "",
    status: "",
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Partial<User>>({});

  // Check permissions
  const canRead = hasPermission("USER", "READ");
  const canCreate = hasPermission("USER", "CREATE");
  const canUpdate = hasPermission("USER", "UPDATE");
  const canDelete = hasPermission("USER", "DELETE");
  const canManageRoles =
    hasPermission("ROLE", "UPDATE") || hasRole("SUPER_ADMIN");

  useEffect(() => {
    if (canRead) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [canRead]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError("Failed to fetch users");
      }
    } catch (error) {
      setError("Error loading users");
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!canDelete || !confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const responseData = await response.json();

      if (response.ok) {
        setUsers(users.filter((user) => user.id !== userId));
        alert("User deleted successfully");
      } else {
        console.error("Delete failed:", responseData);
        alert(
          `Failed to delete user: ${responseData.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Error deleting user: Network or server error");
    }
  };

  const handleUpdateUser = async (
    userId: string,
    updateData: Partial<User>,
  ) => {
    if (!canUpdate) {
      alert("You do not have permission to update users");
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Update the user in the local state
        setUsers(
          users.map((user) =>
            user.id === userId ? { ...user, ...updateData } : user,
          ),
        );
        alert("User updated successfully");
        setShowUserModal(false);
        setSelectedUser(null);
      } else {
        console.error("Update failed:", responseData);
        alert(
          `Failed to update user: ${responseData.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Update error:", error);
      alert("Error updating user: Network or server error");
    }
  };

  const handleRoleChange = async (userId: string, newDefaultRole: string) => {
    if (!canUpdate) {
      alert("You do not have permission to change user roles");
      return;
    }

    if (
      !confirm(
        `Are you sure you want to change this user's role to ${newDefaultRole}?`,
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ defaultRole: newDefaultRole }),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Update the user in the local state
        setUsers(
          users.map((user) =>
            user.id === userId
              ? { ...user, defaultRole: newDefaultRole }
              : user,
          ),
        );
        alert("User role updated successfully");
      } else {
        console.error("Role change failed:", responseData);
        alert(
          `Failed to change user role: ${responseData.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Role change error:", error);
      alert("Error changing user role: Network or server error");
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    if (!canCreate) {
      alert("You do not have permission to create users");
      return;
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userName: userData.userName,
          email: userData.email,
          password: "temp123", // You might want to make this configurable
          defaultRole: userData.defaultRole,
          emailVerified: userData.emailVerified,
        }),
      });

      const responseData = await response.json();

      if (response.ok) {
        // Refresh the users list
        await fetchUsers();
        alert("User created successfully");
        setShowUserModal(false);
        setEditingUser({});
      } else {
        console.error("Create failed:", responseData);
        alert(
          `Failed to create user: ${responseData.error || "Unknown error"}`,
        );
      }
    } catch (error) {
      console.error("Create error:", error);
      alert("Error creating user: Network or server error");
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.userName.toLowerCase().includes(filters.search.toLowerCase()) ||
      user.email.toLowerCase().includes(filters.search.toLowerCase());
    const matchesRole =
      !filters.role ||
      user.defaultRole === filters.role ||
      user.roles.some((role) => role.name === filters.role);
    const matchesStatus =
      !filters.status ||
      (filters.status === "verified" && user.emailVerified) ||
      (filters.status === "unverified" && !user.emailVerified);

    return matchesSearch && matchesRole && matchesStatus;
  });

  if (!canRead) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-medium text-red-800">Access Denied</h3>
          <p className="mt-1 text-sm text-red-600">
            You don&apos;t have permission to view users.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="large" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            User Management
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setSelectedUser(null);
                setEditingUser({
                  userName: "",
                  email: "",
                  defaultRole: "GUEST",
                  emailVerified: false,
                });
                setShowUserModal(true);
              }}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
            >
              <UserPlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
              Add User
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="shadow mt-6 rounded-lg bg-white p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, role: e.target.value }))
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Admin</option>
              <option value="MODERATOR">Moderator</option>
              <option value="INSTRUCTOR">Instructor</option>
              <option value="STUDENT">Student</option>
              <option value="GUEST">Guest</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Status</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchUsers}
            className="mt-2 text-sm text-red-600 underline hover:text-red-500"
          >
            Try again
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="shadow mt-6 overflow-hidden rounded-lg bg-white">
        <div className="px-4 py-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({filteredUsers.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {user.userAvatar ? (
                            <Image
                              className="h-10 w-10 rounded-full"
                              src={user.userAvatar}
                              alt={user.userName}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                              <UserIcon className="h-5 w-5 text-gray-500" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="flex flex-col">
                        <span className="mb-1 inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                          {user.defaultRole}
                        </span>
                        {user.roles.length > 1 && (
                          <span className="text-xs text-gray-500">
                            +{user.roles.length - 1} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          user.emailVerified
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {user.emailVerified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {canUpdate && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setEditingUser({
                                userName: user.userName,
                                email: user.email,
                                defaultRole: user.defaultRole,
                                emailVerified: user.emailVerified,
                              });
                              setShowUserModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {canManageRoles && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRoleModal(true);
                            }}
                            className="text-purple-600 hover:text-purple-500"
                          >
                            <ShieldCheckIcon className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-500"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="py-12 text-center">
                <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No users found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {filters.search || filters.role || filters.status
                    ? "Try adjusting your search filters."
                    : "Get started by adding a new user."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Edit Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                {selectedUser ? "Edit User" : "Add New User"}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editingUser.userName || ""}
                    onChange={(e) =>
                      setEditingUser((prev) => ({
                        ...prev,
                        userName: e.target.value,
                      }))
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingUser.email || ""}
                    onChange={(e) =>
                      setEditingUser((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Default Role
                  </label>
                  <select
                    value={editingUser.defaultRole || "GUEST"}
                    onChange={(e) =>
                      setEditingUser((prev) => ({
                        ...prev,
                        defaultRole: e.target.value,
                      }))
                    }
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="STUDENT">Student</option>
                    <option value="GUEST">Guest</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    id="email-verified"
                    type="checkbox"
                    checked={editingUser.emailVerified || false}
                    onChange={(e) =>
                      setEditingUser((prev) => ({
                        ...prev,
                        emailVerified: e.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label
                    htmlFor="email-verified"
                    className="ml-2 block text-sm text-gray-900"
                  >
                    Email Verified
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowUserModal(false);
                    setSelectedUser(null);
                    setEditingUser({});
                  }}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedUser) {
                      handleUpdateUser(selectedUser.id, editingUser);
                    } else {
                      handleCreateUser(editingUser);
                    }
                  }}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  {selectedUser ? "Update" : "Create"} User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 z-50 h-full w-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative top-20 mx-auto w-96 rounded-md border bg-white p-5 shadow-lg">
            <div className="mt-3">
              <h3 className="mb-4 text-lg font-medium text-gray-900">
                Change Role for {selectedUser.userName}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Current Role:{" "}
                    <span className="font-semibold">
                      {selectedUser.defaultRole}
                    </span>
                  </label>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    New Role
                  </label>
                  <select
                    id="new-role"
                    defaultValue={selectedUser.defaultRole}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="ADMIN">Admin</option>
                    <option value="MODERATOR">Moderator</option>
                    <option value="INSTRUCTOR">Instructor</option>
                    <option value="STUDENT">Student</option>
                    <option value="GUEST">Guest</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }}
                  className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const selectElement = document.getElementById(
                      "new-role",
                    ) as HTMLSelectElement;
                    const newRole = selectElement.value;
                    if (newRole !== selectedUser.defaultRole) {
                      handleRoleChange(selectedUser.id, newRole);
                    }
                    setShowRoleModal(false);
                    setSelectedUser(null);
                  }}
                  className="rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  Change Role
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
