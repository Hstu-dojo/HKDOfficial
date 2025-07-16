"use client";

import { useState } from "react";
import RolesPage from "./RolesPage";
import PermissionsPage from "./PermissionsPage";

export default function RBACDashboardPage() {
  const [activeTab, setActiveTab] = useState<"roles" | "permissions">("permissions");

  return (
    <div className="min-h-screen">
      <div className="shadow">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("permissions")}
              className={`py-4 px-6 font-medium border-b-2 ${
                activeTab === "permissions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              RBAC Management
            </button>
            <button
              onClick={() => setActiveTab("roles")}
              className={`py-4 px-6 font-medium border-b-2 ${
                activeTab === "roles"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Roles Only
            </button>
          </div>
        </div>
      </div>

      <div className="py-6">
        {activeTab === "permissions" ? <PermissionsPage /> : <RolesPage />}
      </div>
    </div>
  );
}
