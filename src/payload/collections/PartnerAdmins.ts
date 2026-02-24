import type { CollectionConfig } from 'payload'

export const PartnerAdmins: CollectionConfig = {
  slug: 'partner-admins',
  auth: true,
  admin: {
    useAsTitle: 'name',
    description: 'Partner organization administrators',
    group: 'Partner Management',
  },
  access: {
    // Only logged-in partner admins can access the admin panel
    admin: ({ req }) => !!req.user,
    // Partner admins can only read their own record
    read: ({ req }) => {
      if (!req.user) return false
      return { id: { equals: req.user.id } }
    },
    // Partner admins can update their own record (except partnerId)
    update: ({ req }) => {
      if (!req.user) return false
      return { id: { equals: req.user.id } }
    },
    // Only Payload API (from main admin) can create partner admins
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
