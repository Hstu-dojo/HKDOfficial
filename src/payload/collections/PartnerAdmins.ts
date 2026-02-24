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
    // Partner admins can read their own record + owners/admins can see co-admins in same org
    read: ({ req }) => {
      if (!req.user) return false
      const user = req.user as Record<string, unknown>
      if (user.role === 'owner' || user.role === 'admin') {
        return { partnerId: { equals: user.partnerId } }
      }
      return { id: { equals: req.user.id } }
    },
    // Partner admins can update their own record; owners can update any admin in same org
    update: ({ req }) => {
      if (!req.user) return false
      const user = req.user as Record<string, unknown>
      if (user.role === 'owner') {
        return { partnerId: { equals: user.partnerId } }
      }
      return { id: { equals: req.user.id } }
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
      type: 'select',
      required: true,
      defaultValue: 'staff',
      label: 'Admin Role',
      options: [
        { label: 'Owner', value: 'owner' },
        { label: 'Admin', value: 'admin' },
        { label: 'Staff', value: 'staff' },
      ],
      admin: {
        description: 'Owner: full control. Admin: can manage most things. Staff: read + limited actions.',
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
