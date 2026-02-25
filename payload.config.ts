import sharp from 'sharp'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { PartnerAdmins } from '@/payload/collections/PartnerAdmins'

export default buildConfig({
  // Seed a system placeholder so Payload never shows "create-first-user".
  // Real partner-admin accounts are created exclusively by super-admins
  // via the main admin dashboard at /admin/partners.
  onInit: async (payload) => {
    const existing = await payload.find({
      collection: 'partner-admins',
      limit: 1,
    })
    if (existing.totalDocs === 0) {
      await payload.create({
        collection: 'partner-admins',
        data: {
          email: 'system@hkd.internal',
          password: process.env.PAYLOAD_SECRET || 'system-placeholder-not-for-login',
          name: 'System (do not use)',
          partnerId: '__system__',
          partnerName: 'System',
          partnerSlug: '__system__',
          isActive: false,          // inactive — cannot log in
        },
      })
      payload.logger.info('Seeded system partner-admin placeholder to bypass create-first-user')
    }
  },

  // Use partner-admins as the auth collection
  admin: {
    user: PartnerAdmins.slug,
    meta: {
      titleSuffix: ' — Partner Portal',
    },
    avatar: 'default',
    theme: 'light',
    components: {
      graphics: {
        Logo: '/src/payload/components/Logo',
        Icon: '/src/payload/components/Icon',
      },
      views: {
        dashboard: {
          Component: '/src/payload/views/PartnerDashboard',
        },
        members: {
          Component: '/src/payload/views/MembersView',
          path: '/members',
          exact: true,
        },
        enrollments: {
          Component: '/src/payload/views/EnrollmentsView',
          path: '/enrollments',
          exact: true,
        },
        bills: {
          Component: '/src/payload/views/BillsView',
          path: '/bills',
          exact: true,
        },
        schedules: {
          Component: '/src/payload/views/SchedulesView',
          path: '/schedules',
          exact: true,
        },
        profile: {
          Component: '/src/payload/views/ProfileView',
          path: '/profile',
          exact: true,
        },
        pageSettings: {
          Component: '/src/payload/views/PageSettingsView',
          path: '/page-settings',
          exact: true,
        },
        pendingStudents: {
          Component: '/src/payload/views/PendingStudentsView',
          path: '/pending-students',
          exact: true,
        },
        monthlyStatus: {
          Component: '/src/payload/views/MonthlyStatusView',
          path: '/monthly-status',
          exact: true,
        },
        branchRequests: {
          Component: '/src/payload/views/BranchRequestsView',
          path: '/branch-requests',
          exact: true,
        },
        adminManagement: {
          Component: '/src/payload/views/AdminManagementView',
          path: '/admin-management',
          exact: true,
        },
      },
    },
  },

  // Payload routes — avoid conflicts with existing /admin and /api
  routes: {
    admin: '/partner-admin',
    api: '/payload-api',
  },

  collections: [PartnerAdmins],

  // Use a separate PostgreSQL schema to isolate Payload tables
  db: postgresAdapter({
    pool: {
      // Strip sslmode from connection string — pg 8.x treats "require" as "verify-full"
      // which rejects Supabase's self-signed certs. We handle SSL explicitly below.
      connectionString: (() => {
        const raw = process.env.DATABASE_URL || ''
        const [base, qs] = raw.split('?')
        if (!qs) return raw
        const filtered = qs.split('&').filter((p) => !p.startsWith('sslmode=')).join('&')
        return filtered ? `${base}?${filtered}` : base
      })(),
      ssl: {
        rejectUnauthorized: false,
      },
    },
    schemaName: 'payload',
    push: process.env.NODE_ENV === 'development',
  }),

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET || 'CHANGE-ME-payload-secret-key-min-32-chars',

  sharp,

  typescript: {
    outputFile: 'src/payload/payload-types.ts',
  },

  // Disable Payload's built-in email (we use Resend in the main app)
  email: undefined,

  // Telemetry opt-out
  telemetry: false,
})
