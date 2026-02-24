import type { CollectionConfig } from 'payload'

export const PartnerAdmins: CollectionConfig = {
  slug: 'partner-admins',
  auth: {
    // Reject inactive partner-admins at login time
    verify: false,
    tokenExpiration: 60 * 60 * 24, // 24h
  },
  hooks: {
    afterLogin: [
      async ({ user }) => {
        if (!user.isActive) {
          throw new Error('Your account has been deactivated. Please contact your administrator.')
        }
      },
    ],
  },
  admin: {
    useAsTitle: 'name',
    description: 'Partner organization administrators',
    group: 'Partner Management',
  },
  access: {
    // Only logged-in partner admins can access the admin panel
    admin: ({ req }) => !!req.user,
    // Any partner admin can see all admins in their org
    read: ({ req }) => {
      if (!req.user) return false
      const user = req.user as Record<string, unknown>
      return { partnerId: { equals: user.partnerId } }
    },
    // Any partner admin can update admins in their org
    update: ({ req }) => {
      if (!req.user) return false
      const user = req.user as Record<string, unknown>
      return { partnerId: { equals: user.partnerId } }
    },
    // Only Payload API (from main admin or partner-portal invite) can create partner admins
    create: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Full Name',
    },
    {
      name: 'partnerId',
      type: 'text',
      required: true,
      label: 'Partner Organization ID',
      admin: {
        readOnly: true,
        description: 'Linked partner organization (set by system)',
      },
      index: true,
    },
    {
      name: 'partnerName',
      type: 'text',
      label: 'Partner Organization',
      admin: {
        readOnly: true,
        description: 'Name of the linked partner organization',
      },
    },
    {
      name: 'partnerSlug',
      type: 'text',
      label: 'Partner Slug',
      admin: {
        readOnly: true,
      },
      index: true,
    },
    {
      name: 'role',
      type: 'text',
      defaultValue: 'admin',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone Number',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Active',
      admin: {
        readOnly: true,
        description: 'Controlled by system admin',
      },
    },
  ],
  timestamps: true,
}
