"use client";

import { createContext } from "react";
import type { UserPermissions } from "@/lib/rbac/types";

/** Permissions checked on the server, shared by the entire admin subtree. */
export const AdminPermissionsContext = createContext<UserPermissions | null>(
  null,
);

export function AdminPermissionsProvider({
  permissions,
  children,
}: {
  permissions: UserPermissions;
  children: React.ReactNode;
}) {
  return (
    <AdminPermissionsContext.Provider value={permissions}>
      {children}
    </AdminPermissionsContext.Provider>
  );
}
