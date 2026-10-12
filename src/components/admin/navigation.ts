import {
  ChartBarIcon,
  UserGroupIcon,
  CalendarIcon,
  DocumentTextIcon,
  PhotoIcon,
  MapIcon,
  ShieldCheckIcon,
  MegaphoneIcon,
  AcademicCapIcon,
  TicketIcon,
  BookOpenIcon,
  BanknotesIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { canAccessAdminRoute } from "@/lib/rbac/admin-route-access";
export interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const navigation: NavItem[] = [
  { name:"Attendance", href:"/admin/attendance", icon:ClipboardDocumentListIcon, description:"Review course registers and monthly attendance across branches" },
  {
    name: "Competition Results",
    href: "/admin/competition-results",
    icon: ChartBarIcon,
    description: "Publish competition finishes and medal rankings",
  },
  {
    name: "Dashboard",
    href: "/admin",
    icon: ChartBarIcon,
    description: "Admin dashboard overview",
  },
  {
    name: "RBAC Management",
    href: "/admin/rbac",
    icon: ShieldCheckIcon,
    description: "Manage roles and permissions",
  },
  {
    name: "Registrations",
    href: "/admin/registrations",
    icon: ClipboardDocumentListIcon,
    description: "View and manage member registrations",
  },
  {
    name: "Committees",
    href: "/admin/committees",
    icon: UserGroupIcon,
    description: "Manage committee terms and applications",
  },
  {
    name: "FAQs",
    href: "/admin/faqs",
    icon: DocumentTextIcon,
    description: "Edit homepage questions and translations",
  },
  {
    name: "Testimonials",
    href: "/admin/testimonials",
    icon: DocumentTextIcon,
    description: "Review member testimonials before publication",
  },
  {
    name: "Sensei & Team",
    href: "/admin/instructors",
    icon: UserGroupIcon,
    description: "Edit sensei, instructor and black-belt profiles",
  },
  {
    name: "Class Schedule",
    href: "/admin/class-schedule",
    icon: CalendarIcon,
    description: "Manage class schedules",
  },
  {
    name: "Course Management",
    href: "/admin/courses",
    icon: DocumentTextIcon,
    description: "Manage courses and content",
  },
  {
    name: "Media Gallery",
    href: "/admin/gallery",
    icon: PhotoIcon,
    description: "Manage media and images",
  },
  {
    name: "Programs & Events",
    href: "/admin/programs",
    icon: TicketIcon,
    description: "Manage programs, belt tests, and events",
  },
  {
    name: "Monthly Fees",
    href: "/admin/monthly-fees",
    icon: BanknotesIcon,
    description: "Manage student fee payments",
  },
  {
    name: "Org Billing",
    href: "/admin/org-billing",
    icon: BuildingOffice2Icon,
    description: "Organization billing overview",
  },
  {
    name: "Payment Settings",
    href: "/admin/payment-settings",
    icon: CreditCardIcon,
    description: "Configure bKash, Nagad accounts",
  },
  {
    name: "Notice board",
    href: "/admin/announcements",
    icon: MegaphoneIcon,
    description: "Publish academy notices",
  },
  {
    name: "Certificates",
    href: "/admin/certificates",
    icon: AcademicCapIcon,
    description: "Manage certificates",
  },
  {
    name: "Email Management",
    href: "/admin/emails",
    icon: MapIcon,
    description: "All platform email history",
  },
  {
    name: "Documentation",
    href: "/admin/docs",
    icon: BookOpenIcon,
    description: "Developer & API docs index",
  },
  {
    name: "Partners",
    href: "/admin/partners",
    icon: BuildingOffice2Icon,
    description: "Manage partner organizations",
  },
];

export interface AdminNavigationGroup {
  title: string;
  items: NavItem[];
}
const groups = [
  { title: "Overview", routes: ["/admin"] },
  {
    title: "Members & training",
    routes: [
      "/admin/registrations",
      "/admin/students",
      "/admin/attendance",
      "/admin/enrollments",
      "/admin/committees",
      "/admin/instructors",
      "/admin/courses",
      "/admin/class-schedule",
    ],
  },
  {
    title: "Programs & competitions",
    routes: [
      "/admin/programs",
      "/admin/programs/types",
      "/admin/programs/registrations",
      "/admin/competition-results",
      "/admin/certificates",
      "/admin/programs/certificates",
      "/admin/programs/signatures",
    ],
  },
  {
    title: "Content & communication",
    routes: [
      "/admin/gallery",
      "/admin/announcements",
      "/admin/faqs",
      "/admin/testimonials",
      "/admin/emails",
    ],
  },
  {
    title: "Finance & partners",
    routes: [
      "/admin/monthly-fees",
      "/admin/org-billing",
      "/admin/payment-settings",
      "/admin/partners",
    ],
  },
  {
    title: "Administration",
    routes: ["/admin/rbac", "/admin/create-admin", "/admin/docs"],
  },
];
const additional: NavItem[] = [
  {
    name: "Student Records",
    href: "/admin/students",
    icon: UserGroupIcon,
    description: "View enrollment forms, scans and supporting documents",
  },
  {
    name: "Enrollments",
    href: "/admin/enrollments",
    icon: AcademicCapIcon,
    description: "Review course enrollments and student applications",
  },
  {
    name: "Program Types",
    href: "/admin/programs/types",
    icon: TicketIcon,
    description: "Configure program and event categories",
  },
  {
    name: "Program Registrations",
    href: "/admin/programs/registrations",
    icon: ClipboardDocumentListIcon,
    description: "Review event participants and registrations",
  },
  {
    name: "Program Certificates",
    href: "/admin/programs/certificates",
    icon: AcademicCapIcon,
    description: "Manage certificates for program participants",
  },
  {
    name: "Certificate Signatures",
    href: "/admin/programs/signatures",
    icon: DocumentTextIcon,
    description: "Manage certificate signatures",
  },
  {
    name: "Create Admin User",
    href: "/admin/create-admin",
    icon: ShieldCheckIcon,
    description: "Create an administrator account",
  },
];
export const adminNavigationGroups: AdminNavigationGroup[] = groups.map(
  (group) => ({
    title: group.title,
    items: group.routes
      .map((route) =>
        [...navigation, ...additional].find((item) => item.href === route)!,
      )
      .filter(Boolean),
  }),
);
export function getVisibleAdminNavigation(
  permissions: Parameters<typeof canAccessAdminRoute>[0] | null | undefined,
) {
  return adminNavigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => permissions && canAccessAdminRoute(permissions, item.href),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
export function isAdminNavigationActive(
  pathname: string,
  href: string,
  locale: string,
) {
  const path = pathname.replace(new RegExp(`^/${locale}(?=/)`), "");
  const match = adminNavigationGroups
    .flatMap((group) => group.items)
    .filter(
      (item) =>
        path === item.href ||
        (item.href !== "/admin" && path.startsWith(item.href + "/")),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
  return match?.href === href;
}
