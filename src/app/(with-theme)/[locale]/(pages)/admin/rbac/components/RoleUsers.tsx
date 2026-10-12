"use client";
import { useEffect, useState } from "react";
import { useRBAC } from "@/hooks/useRBAC";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Role = { id: string; name: string; isActive: boolean };
type Results = {
  role: Role;
  users: { id: string; userName: string | null; email: string }[];
  pagination: { page: number; total: number; totalPages: number };
};
export default function RoleUsers() {
  const { hasPermission } = useRBAC();
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleId, setRoleId] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const canRead =
    hasPermission("USER", "READ") && hasPermission("ROLE", "READ");
  useEffect(() => {
    if (!canRead) return;
    const controller = new AbortController();
    fetch("/api/rbac/roles", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Unable to load roles.");
        const data = await response.json();
        setRoles(data.roles || []);
      })
      .catch((error) => {
        if (error.name !== "AbortError") setError(error.message);
      });
    return () => controller.abort();
  }, [canRead, retry]);
  useEffect(() => {
    setResults(null);
    if (!canRead || !roleId) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ page: String(page), search });
        const response = await fetch(
          `/api/rbac/roles/${encodeURIComponent(roleId)}/users?${query}`,
          { signal: controller.signal },
        );
        if (!response.ok)
          throw new Error("Unable to load users for this role.");
        setResults(await response.json());
      } catch (error: any) {
        if (error.name !== "AbortError") setError(error.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [canRead, roleId, search, page, retry]);
  if (!canRead)
    return (
      <p className="rounded-xl border bg-card p-5 text-sm text-muted-foreground">
        Viewing role members requires user and role viewing permissions.
      </p>
    );
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Users by role</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Find users with a current role assignment. Inactive assignments are
          excluded.
        </p>
      </div>
      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          <span className="block">Role</span>
          <select
            className="h-10 w-full rounded-md border bg-background px-3"
            value={roleId}
            onChange={(e) => {
              setRoleId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
                {role.isActive ? "" : " (inactive role)"}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2 text-sm font-medium">
          <span className="block">Name or email</span>
          <Input
            value={search}
            maxLength={200}
            disabled={!roleId}
            placeholder="Search within this role"
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>
      {error && (
        <div role="alert" className="rounded-xl border p-4 text-sm">
          {error}
          <Button
            className="ml-3"
            variant="outline"
            size="sm"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </Button>
        </div>
      )}
      <div
        aria-live="polite"
        aria-busy={loading}
        className="overflow-hidden rounded-xl border bg-card"
      >
        {loading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading members…</p>
        ) : results ? (
          <>
            <div className="border-b p-4 text-sm font-medium">
              {results.role.name} · {results.pagination.total} matching users
              {!results.role.isActive && (
                <span className="ml-2 text-muted-foreground">
                  This role is inactive.
                </span>
              )}
            </div>
            {results.users.length ? (
              <ul className="divide-y">
                {results.users.map((user) => (
                  <li key={user.id} className="min-w-0 p-4">
                    <p className="break-words text-sm font-medium">
                      {user.userName || user.email}
                    </p>
                    <p className="break-all text-sm text-muted-foreground">
                      {user.email}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="p-6 text-sm text-muted-foreground">
                No users match this role and search.
              </p>
            )}
            {results.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 border-t p-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  {page} / {results.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= results.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          !error && (
            <p className="p-6 text-sm text-muted-foreground">
              Select a role to see its members.
            </p>
          )
        )}
      </div>
    </section>
  );
}
