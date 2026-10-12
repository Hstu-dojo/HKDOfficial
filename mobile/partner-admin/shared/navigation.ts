export const partnerNavigation = [
  {
    title: "Core",
    items: [
      {
        href: "/partner-admin",
        label: "Dashboard",
        icon: "LayoutDashboard",
        nativeIcon: "grid-outline",
      },
      {
        href: "/partner-admin/portal/members",
        label: "Members",
        icon: "Users",
        nativeIcon: "people-outline",
      },
      {
        href: "/partner-admin/portal/attendance",
        label: "Attendance",
        icon: "UserCheck",
        nativeIcon: "checkbox-outline",
      },
    ],
  },
  {
    title: "Admissions & Transfers",
    items: [
      {
        href: "/partner-admin/portal/enrollments",
        label: "Enrollments",
        icon: "GraduationCap",
        nativeIcon: "school-outline",
      },
      {
        href: "/partner-admin/portal/pending-students",
        label: "Pending Students",
        icon: "UserCheck",
        nativeIcon: "person-add-outline",
      },
      {
        href: "/partner-admin/portal/branch-requests",
        label: "Branch Change",
        icon: "ArrowLeftRight",
        nativeIcon: "swap-horizontal-outline",
      },
    ],
  },
  {
    title: "Financial Management",
    items: [
      {
        href: "/partner-admin/portal/monthly-billing",
        label: "Monthly Billing",
        icon: "Receipt",
        nativeIcon: "receipt-outline",
      },
      {
        href: "/partner-admin/portal/bills",
        label: "Bills",
        icon: "CreditCard",
        nativeIcon: "wallet-outline",
      },
      {
        href: "/partner-admin/portal/emails",
        label: "Email History",
        icon: "Mail",
        nativeIcon: "mail-outline",
      },
      {
        href: "/partner-admin/portal/monthly-status",
        label: "Monthly Status",
        icon: "BarChart3",
        nativeIcon: "bar-chart-outline",
      },
    ],
  },
  {
    title: "Settings & Administration",
    items: [
      {
        href: "/partner-admin/portal/schedules",
        label: "Schedules",
        icon: "Calendar",
        nativeIcon: "calendar-outline",
      },
      {
        href: "/partner-admin/portal/profile",
        label: "Profile",
        icon: "Building2",
        nativeIcon: "business-outline",
      },
      {
        href: "/partner-admin/portal/page-settings",
        label: "Page Settings",
        icon: "Sliders",
        nativeIcon: "options-outline",
      },
      {
        href: "/partner-admin/portal/admin-management",
        label: "Admin Management",
        icon: "ShieldAlert",
        nativeIcon: "shield-checkmark-outline",
      },
    ],
  },
] as const;
