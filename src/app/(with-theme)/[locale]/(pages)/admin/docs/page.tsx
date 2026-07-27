import { Metadata } from "next";
import Link from "next/link";
import {
  BookOpenIcon,
  CodeBracketIcon,
  CircleStackIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  EnvelopeIcon,
  MapIcon,
  DocumentTextIcon,
  CommandLineIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

export const metadata: Metadata = {
  title: "Documentation Index | Admin",
  description: "Full navigation index of all internal developer documentation",
};

interface DocLink {
  title: string;
  href: string;
  description?: string;
}

interface DocSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  links: DocLink[];
}

const sections: DocSection[] = [
  {
    title: "Getting Started",
    icon: BookOpenIcon,
    color: "blue",
    links: [
      {
        title: "Readme / Overview",
        href: "/docs/readme",
        description: "Project overview and quick-start guide",
      },
      {
        title: "Index",
        href: "/docs",
        description: "Documentation homepage",
      },
      {
        title: "Developer Info",
        href: "/docs/dev",
        description: "Local setup, env vars, and dev workflows",
      },
    ],
  },
  {
    title: "API Documentation",
    icon: CodeBracketIcon,
    color: "violet",
    links: [
      {
        title: "API Documentation (Full)",
        href: "/docs/API_DOCUMENTATION",
        description: "Complete REST API reference",
      },
      {
        title: "Interactive API Docs",
        href: "/docs/api",
        description: "Swagger / interactive API explorer",
      },
      {
        title: "API Endpoints Overview",
        href: "/docs/api/endpoints",
        description: "High-level list of all API endpoints",
      },
    ],
  },
  {
    title: "Database & Schema",
    icon: CircleStackIcon,
    color: "emerald",
    links: [
      {
        title: "Database",
        href: "/docs/database",
        description: "Schema overview and table definitions",
      },
      {
        title: "ERD Diagram",
        href: "/docs/erd",
        description: "Entity-relationship diagram",
      },
      {
        title: "Database Live View",
        href: "/docs/db_live",
        description: "Live database status dashboard",
      },
      {
        title: "Supabase Migration",
        href: "/docs/SUPABASE_MIGRATION",
        description: "Migration guide from previous DB setup",
      },
    ],
  },
  {
    title: "Authentication & Security",
    icon: ShieldCheckIcon,
    color: "rose",
    links: [
      {
        title: "Auth Server Implementation",
        href: "/docs/AUTH_SERVER_IMPLEMENTATION",
        description: "Authentication flow and server architecture",
      },
      {
        title: "RBAC Implementation Guide",
        href: "/docs/rbac/RBAC_IMPLEMENTATION_GUIDE",
        description: "Role-based access control setup guide",
      },
      {
        title: "RBAC Implementation Summary",
        href: "/docs/rbac/RBAC_IMPLEMENTATION_SUMMARY",
        description: "High-level summary of roles and permissions",
      },
    ],
  },
  {
    title: "Socials & OAuth",
    icon: GlobeAltIcon,
    color: "sky",
    links: [
      {
        title: "Social Auth Implementation Plan",
        href: "/docs/socials/SOCIAL_AUTH_IMPLEMENTATION_PLAN",
        description: "Plan for integrating social login providers",
      },
      {
        title: "Social Auth Quick Start",
        href: "/docs/socials/SOCIAL_AUTH_QUICK_START",
        description: "Quick-start instructions for OAuth setup",
      },
      {
        title: "Social Auth Research Summary",
        href: "/docs/socials/SOCIAL_AUTH_RESEARCH_SUMMARY",
        description: "Research notes comparing OAuth providers",
      },
    ],
  },
  {
    title: "Email",
    icon: EnvelopeIcon,
    color: "amber",
    links: [
      {
        title: "Email Templates",
        href: "/docs/email-templates",
        description: "Transactional email templates reference",
      },
    ],
  },
  {
    title: "Sitemap & SEO",
    icon: MapIcon,
    color: "teal",
    links: [
      {
        title: "Google News Setup",
        href: "/docs/sitemap/GOOGLE_NEWS_SETUP",
        description: "Guide for Google News Publisher Center",
      },
      {
        title: "Publisher Center Status",
        href: "/docs/sitemap/PUBLISHER_CENTER_STATUS",
        description: "Current status of Google Publisher Center",
      },
    ],
  },
  {
    title: "Partner Portal",
    icon: CommandLineIcon,
    color: "orange",
    links: [
      {
        title: "Partner Onboarding Flow",
        href: "/docs/PARTNER_ONBOARDING_FLOW",
        description: "Partner registration and onboarding process",
      },
    ],
  },
];

const colorMap: Record<string, { bg: string; border: string; icon: string; badge: string; link: string }> = {
  blue: {
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    icon: "text-blue-600 dark:text-blue-400",
    badge: "bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300",
    link: "hover:text-blue-600 dark:hover:text-blue-400",
  },
  violet: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    border: "border-violet-200 dark:border-violet-800",
    icon: "text-violet-600 dark:text-violet-400",
    badge: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300",
    link: "hover:text-violet-600 dark:hover:text-violet-400",
  },
  emerald: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    border: "border-emerald-200 dark:border-emerald-800",
    icon: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300",
    link: "hover:text-emerald-600 dark:hover:text-emerald-400",
  },
  rose: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    border: "border-rose-200 dark:border-rose-800",
    icon: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300",
    link: "hover:text-rose-600 dark:hover:text-rose-400",
  },
  sky: {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    border: "border-sky-200 dark:border-sky-800",
    icon: "text-sky-600 dark:text-sky-400",
    badge: "bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300",
    link: "hover:text-sky-600 dark:hover:text-sky-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-200 dark:border-amber-800",
    icon: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
    link: "hover:text-amber-600 dark:hover:text-amber-400",
  },
  teal: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    border: "border-teal-200 dark:border-teal-800",
    icon: "text-teal-600 dark:text-teal-400",
    badge: "bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300",
    link: "hover:text-teal-600 dark:hover:text-teal-400",
  },
  orange: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    icon: "text-orange-600 dark:text-orange-400",
    badge: "bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300",
    link: "hover:text-orange-600 dark:hover:text-orange-400",
  },
};

export default function AdminDocsPage() {
  const totalDocs = sections.reduce((sum, s) => sum + s.links.length, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-slate-900 dark:bg-slate-100 rounded-lg">
            <BookOpenIcon className="h-6 w-6 text-white dark:text-slate-900" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Documentation Index
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {sections.length} sections · {totalDocs} documents
            </p>
          </div>
        </div>
        <p className="text-slate-600 dark:text-slate-400 mt-3 max-w-2xl">
          Full navigation map of all internal developer documentation. All links
          open the corresponding Nextra docs page (admin-protected).
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Link
            href="/docs"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            Open Docs Root
          </Link>
        </div>
      </div>

      {/* Section grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {sections.map((section) => {
          const c = colorMap[section.color];
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className={`rounded-xl border ${c.border} ${c.bg} p-5 flex flex-col gap-3`}
            >
              {/* Section header */}
              <div className="flex items-center gap-2.5">
                <Icon className={`h-5 w-5 flex-shrink-0 ${c.icon}`} />
                <h2 className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  {section.title}
                </h2>
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${c.badge}`}>
                  {section.links.length}
                </span>
              </div>

              {/* Links */}
              <ul className="space-y-1.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`group flex items-start gap-2 rounded-lg px-3 py-2 bg-white/60 dark:bg-slate-900/40 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-900/70 transition-all`}
                    >
                      <DocumentTextIcon className="h-4 w-4 mt-0.5 flex-shrink-0 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                      <div>
                        <div className={`text-sm font-medium text-slate-700 dark:text-slate-300 ${c.link} transition-colors`}>
                          {link.title}
                        </div>
                        {link.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                            {link.description}
                          </div>
                        )}
                      </div>
                      <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5 ml-auto mt-0.5 flex-shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
