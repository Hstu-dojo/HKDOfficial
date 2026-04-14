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

  // Keep Payload for auth + REST API only.
  // The Partner Admin portal UI is implemented with plain Next.js routes under /partner-admin.
  admin: {
    user: PartnerAdmins.slug,
    meta: {
      titleSuffix: ' — Partner Portal',
    },
  },

  // Payload routes — keep API on /payload-api, move admin UI away from /partner-admin
  // to avoid conflicts with the custom Next.js partner portal.
  routes: {
    admin: '/payload-admin',
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
