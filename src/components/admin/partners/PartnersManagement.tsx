'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'

interface Partner {
  id: string
  name: string
  slug: string
  description: string | null
  location: string | null
  contactEmail: string | null
  contactPhone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  memberCount: number
}

interface PartnerAdmin {
  id: string
  name: string
  email: string
  phone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function PartnersManagement() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Admin management state
  const [showAdminModal, setShowAdminModal] = useState(false)
  const [adminPartner, setAdminPartner] = useState<Partner | null>(null)
  const [partnerAdmins, setPartnerAdmins] = useState<PartnerAdmin[]>([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [adminError, setAdminError] = useState('')
  const [adminSuccess, setAdminSuccess] = useState('')
  const [savingAdmin, setSavingAdmin] = useState(false)
  const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null)
  const [showAddAdmin, setShowAddAdmin] = useState(false)
  const [adminForm, setAdminForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  })

  // Tenant domains state
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [tenantDomains, setTenantDomains] = useState<Array<{slug:string; domain:string}>>([])
  const [tenantLoading, setTenantLoading] = useState(false)
  const [tenantError, setTenantError] = useState('')
  const [tenantSuccess, setTenantSuccess] = useState('')
  const [newTenantSlug, setNewTenantSlug] = useState('')
  const [tenantSaving, setTenantSaving] = useState(false)

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    location: '',
    contactEmail: '',
    contactPhone: '',
    adminName: '',
    adminEmail: '',
    adminPassword: '',
  })

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setPartners(data.partners)
    } catch {
      setError('Failed to load partners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPartners()
  }, [fetchPartners])

  // ── Admin account management ──
  const fetchAdmins = useCallback(async (partnerId: string) => {
    setLoadingAdmins(true)
    setAdminError('')
    try {
      const res = await fetch(`/api/admin/partners/admins?partnerId=${partnerId}`)
      if (!res.ok) throw new Error('Failed to fetch admins')
      const data = await res.json()
      setPartnerAdmins(data.admins)
    } catch {
      setAdminError('Failed to load admin accounts')
    } finally {
      setLoadingAdmins(false)
    }
  }, [])

  const openAdminModal = (partner: Partner) => {
    setAdminPartner(partner)
    setShowAdminModal(true)
    setShowAddAdmin(false)
    setAdminError('')
    setAdminSuccess('')
    setAdminForm({ name: '', email: '', password: '', phone: '' })
    fetchAdmins(partner.id)
  }

  const fetchTenantDomains = async () => {
    setTenantLoading(true)
    setTenantError('')
    try {
      const res = await fetch('/api/admin/partners/tenant-domains')
      if (!res.ok) throw new Error('Failed to fetch tenant domains')
      const data = await res.json()
      setTenantDomains(data.domains || [])
    } catch (err: any) {
      setTenantError(err?.message || 'Could not fetch tenant domains')
    } finally {
      setTenantLoading(false)
    }
  }

  const openTenantModal = async () => {
    setShowTenantModal(true)
    setTenantSuccess('')
    setTenantError('')
    setNewTenantSlug('')
    await fetchTenantDomains()
  }

  const handleAddTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    const sanitizedSlug = slugify(newTenantSlug || '')
    if (!sanitizedSlug) {
      setTenantError('Please enter a valid slug')
      return
    }

    setTenantSaving(true)
    setTenantError('')
    setTenantSuccess('')

    try {
      const res = await fetch('/api/admin/partners/tenant-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: sanitizedSlug }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add tenant domain')

      setTenantSuccess(`Added tenant subdomain: ${sanitizedSlug}`)
      setNewTenantSlug('')
      await fetchTenantDomains()
    } catch (err: any) {
      setTenantError(err?.message || 'Failed to add tenant domain')
    } finally {
      setTenantSaving(false)
    }
  }

  const handleRemoveTenant = async (slug: string) => {
    if (!confirm(`Remove tenant subdomain '${slug}'?`)) return

    setTenantError('')
    setTenantSuccess('')

    try {
      const res = await fetch(`/api/admin/partners/tenant-domains?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to remove tenant domain')

      setTenantSuccess(`Removed tenant subdomain: ${slug}`)
      await fetchTenantDomains()
    } catch (err: any) {
      setTenantError(err?.message || 'Failed to remove tenant domain')
    }
  }

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!adminPartner) return
    setSavingAdmin(true)
    setAdminError('')
    setAdminSuccess('')

    try {
      const res = await fetch('/api/admin/partners/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: adminPartner.id,
          name: adminForm.name,
          email: adminForm.email,
          password: adminForm.password,
          phone: adminForm.phone,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create admin')

      setAdminSuccess(data.message || 'Admin account created')
      setAdminForm({ name: '', email: '', password: '', phone: '' })
      setShowAddAdmin(false)
      fetchAdmins(adminPartner.id)
    } catch (err: any) {
      setAdminError(err.message || 'Failed to create admin')
    } finally {
      setSavingAdmin(false)
    }
  }

  const handleDeleteAdmin = async (adminId: string) => {
    if (!adminPartner) return
    if (!confirm('Are you sure you want to permanently delete this admin account? They will lose all access.')) return

    setDeletingAdminId(adminId)
    setAdminError('')
    setAdminSuccess('')

    try {
      const res = await fetch('/api/admin/partners/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId,
          partnerId: adminPartner.id,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete admin')

      setAdminSuccess('Admin account deleted')
      fetchAdmins(adminPartner.id)
    } catch (err: any) {
      setAdminError(err.message || 'Failed to delete admin')
    } finally {
      setDeletingAdminId(null)
    }
  }

  const openCreateModal = () => {
    setEditingPartner(null)
    setForm({
      name: '',
      slug: '',
      description: '',
      location: '',
      contactEmail: '',
      contactPhone: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    })
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const openEditModal = (partner: Partner) => {
    setEditingPartner(partner)
    setForm({
      name: partner.name,
      slug: partner.slug,
      description: partner.description || '',
      location: partner.location || '',
      contactEmail: partner.contactEmail || '',
      contactPhone: partner.contactPhone || '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
    })
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: editingPartner ? prev.slug : slugify(name),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (editingPartner) {
        // Update
        const res = await fetch('/api/admin/partners', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingPartner.id,
            name: form.name,
            slug: form.slug,
            description: form.description,
            location: form.location,
            contactEmail: form.contactEmail,
            contactPhone: form.contactPhone,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to update')

        setSuccess('Partner updated successfully')
        fetchPartners()
        setTimeout(() => setShowModal(false), 1000)
      } else {
        // Create
        if (!form.adminEmail || !form.adminPassword) {
          setError('Admin email and password are required for new partners')
          setSaving(false)
          return
        }

        if (form.adminPassword.length < 8) {
          setError('Admin password must be at least 8 characters')
          setSaving(false)
          return
        }

        const res = await fetch('/api/admin/partners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Failed to create')

        setSuccess(data.message || 'Partner created successfully')
        fetchPartners()
        setTimeout(() => setShowModal(false), 2000)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (partner: Partner) => {
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: partner.id,
          isActive: !partner.isActive,
        }),
      })

      if (!res.ok) throw new Error('Failed to update')
      fetchPartners()
    } catch {
      setError('Failed to update partner status')
    }
  }

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.location || '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Partner Organizations
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage partner venues and their admin accounts
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={openTenantModal}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            <UserPlusIcon className="h-5 w-5" />
            Tenant Subdomains
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
          >
            <PlusIcon className="h-5 w-5" />
            Create Partner
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search partners..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        />
      </div>

      {/* Partners Grid */}
      {filteredPartners.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
          <BuildingOffice2Icon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            No partners found
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {search ? 'Try a different search term' : 'Get started by creating a new partner organization'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPartners.map((partner) => (
            <div
              key={partner.id}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <BuildingOffice2Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {partner.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      /{partner.slug}
                    </p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                    partner.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {partner.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Card Body */}
              <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {partner.location && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{partner.location}</span>
                  </div>
                )}
                {partner.contactEmail && (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{partner.contactEmail}</span>
                  </div>
                )}
                {partner.contactPhone && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="h-4 w-4 shrink-0" />
                    <span>{partner.contactPhone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="h-4 w-4 shrink-0" />
                  <span>{partner.memberCount} member{partner.memberCount !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
                <button
                  onClick={() => openEditModal(partner)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => toggleActive(partner)}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium ${
                    partner.isActive
                      ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20'
                      : 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                  }`}
                >
                  {partner.isActive ? (
                    <>
                      <XCircleIcon className="h-3.5 w-3.5" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-3.5 w-3.5" />
                      Activate
                    </>
                  )}
                </button>
                <button
                  onClick={() => openAdminModal(partner)}
                  className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
                >
                  <ShieldCheckIcon className="h-3.5 w-3.5" />
                  Admins
                </button>
                <a
                  href={`/org/${partner.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
                  View
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
          <div className="min-h-full flex items-start sm:items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b p-5 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {editingPartner ? 'Edit Partner' : 'Create New Partner'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  {success}
                </div>
              )}

              {/* Organization Info */}
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Organization Info
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g. HKD Dhaka Branch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="hkd-dhaka-branch"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    URL: /org/{form.slug || '...'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="Brief description of the partner organization"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Location
                  </label>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    placeholder="City, Country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              {/* Admin Account — only for new partners */}
              {!editingPartner && (
                <>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Partner Admin Account
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    These credentials will be used by the partner to log into their admin panel at{' '}
                    <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">/partner-admin</code>
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Admin Name
                      </label>
                      <input
                        type="text"
                        value={form.adminName}
                        onChange={(e) => setForm((p) => ({ ...p, adminName: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Admin's full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Admin Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required={!editingPartner}
                        value={form.adminEmail}
                        onChange={(e) => setForm((p) => ({ ...p, adminEmail: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="admin@partner.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Admin Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required={!editingPartner}
                      minLength={8}
                      value={form.adminPassword}
                      onChange={(e) => setForm((p) => ({ ...p, adminPassword: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Min 8 characters"
                    />
                  </div>
                </>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 border-t pt-4 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingPartner ? 'Update Partner' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
        </div>
      )}

      {/* Admin Accounts Modal */}
      {showAdminModal && adminPartner && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
          <div className="min-h-full flex items-start sm:items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b p-5 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Admin Accounts
                </h2>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                  {adminPartner.name} — manage who can access /partner-admin
                </p>
              </div>
              <button
                onClick={() => setShowAdminModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {adminError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {adminError}
                </div>
              )}
              {adminSuccess && (
                <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
                  {adminSuccess}
                </div>
              )}

              {/* Existing admins list */}
              {loadingAdmins ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                </div>
              ) : partnerAdmins.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No admin accounts found for this partner.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
                  {partnerAdmins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between gap-4 px-4 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                            {admin.name}
                          </p>
                          <span
                            className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              admin.isActive
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {admin.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <EnvelopeIcon className="h-3 w-3" />
                            {admin.email}
                          </span>
                          {admin.phone && (
                            <span className="flex items-center gap-1">
                              <PhoneIcon className="h-3 w-3" />
                              {admin.phone}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">
                          Created {new Date(admin.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id)}
                        disabled={deletingAdminId === admin.id}
                        className="shrink-0 rounded p-1.5 text-red-500 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        title="Delete admin account"
                      >
                        {deletingAdminId === admin.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-red-500" />
                        ) : (
                          <TrashIcon className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new admin toggle / form */}
              {!showAddAdmin ? (
                <button
                  onClick={() => {
                    setShowAddAdmin(true)
                    setAdminError('')
                    setAdminSuccess('')
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700"
                >
                  <UserPlusIcon className="h-4 w-4" />
                  Add New Admin
                </button>
              ) : (
                <form onSubmit={handleAddAdmin} className="space-y-3 rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-800 dark:bg-purple-900/10">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    New Admin Account
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Name
                      </label>
                      <input
                        type="text"
                        value={adminForm.name}
                        onChange={(e) => setAdminForm((p) => ({ ...p, name: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Admin's full name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={adminForm.phone}
                        onChange={(e) => setAdminForm((p) => ({ ...p, phone: e.target.value }))}
                        className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={adminForm.email}
                      onChange={(e) => setAdminForm((p) => ({ ...p, email: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="admin@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={adminForm.password}
                      onChange={(e) => setAdminForm((p) => ({ ...p, password: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      placeholder="Min 8 characters"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={savingAdmin}
                      className="rounded-lg bg-purple-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {savingAdmin ? 'Creating...' : 'Create Admin'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddAdmin(false)}
                      className="rounded-lg bg-gray-100 px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
        </div>
      )}
      {/* Tenant Subdomains Modal */}
      {showTenantModal && (
        <div className="fixed inset-0 z-50 bg-black/50 overflow-y-auto">
          <div className="min-h-full flex items-start sm:items-center justify-center p-4">
            <div className="w-full max-w-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto rounded-xl bg-white shadow-2xl dark:bg-gray-800">
            <div className="flex items-center justify-between border-b p-5 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Tenant Subdomains</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Add or remove tenant subdomains under {process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN || 'p.hstuma.com'}.</p>
              </div>
              <button
                onClick={() => setShowTenantModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {tenantError && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{tenantError}</div>}
              {tenantSuccess && <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">{tenantSuccess}</div>}

              <form onSubmit={handleAddTenant} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
                <input
                  type="text"
                  value={newTenantSlug}
                  onChange={(e) => setNewTenantSlug(e.target.value)}
                  placeholder="Add tenant slug (e.g. this, that)"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={tenantSaving}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {tenantSaving ? 'Adding...' : 'Add Tenant'}
                </button>
              </form>

              <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700">
                {tenantLoading ? (
                  <div className="flex h-24 items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-600" />
                  </div>
                ) : tenantDomains.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400">No tenant subdomains found.</div>
                ) : (
                  <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {tenantDomains.map((domain) => (
                      <li key={domain.slug} className="flex items-center justify-between px-4 py-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">{domain.slug}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{domain.domain}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTenant(domain.slug)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
      )}    </div>
  )
}
