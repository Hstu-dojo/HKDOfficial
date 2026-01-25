"use client";

import { useState } from "react";
import RolesPage from "./RolesPage";
import PermissionsPage from "./PermissionsPage";
import PermissionMatrix from "./components/PermissionMatrix";
import UserRolesManagement from "./components/UserRolesManagement";
import RolePermissionsManagement from "./components/RolePermissionsManagement";

type TabType = "matrix" | "user-roles" | "role-permissions" | "permissions" | "roles";

export default function RBACDashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>("matrix");

  const tabs: { id: TabType; label: string; description: string }[] = [
    { id: "matrix", label: "Permission Matrix", description: "Visual overview of all role permissions" },
    { id: "user-roles", label: "User Roles", description: "Assign roles to users" },
    { id: "role-permissions", label: "Role Permissions", description: "Manage permissions per role" },
    { id: "permissions", label: "Permissions", description: "Create and manage permissions" },
    { id: "roles", label: "Roles", description: "View and manage roles" },
  ];

  return (
    <div className="min-h-screen">
      <div className="shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap gap-2 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-4 font-medium rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                title={tab.description}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="py-6 max-w-7xl mx-auto px-4">
        {activeTab === "matrix" && <PermissionMatrix />}
        {activeTab === "user-roles" && <UserRolesManagement />}
        {activeTab === "role-permissions" && <RolePermissionsManagement />}
        {activeTab === "permissions" && <PermissionsPage />}
        {activeTab === "roles" && <RolesPage />}
      </div>
    </div>
  );
}
