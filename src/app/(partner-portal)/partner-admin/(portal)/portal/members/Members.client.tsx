'use client'

import * as React from 'react'
import { apiJSON } from '../../_lib/api.client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Member = {
  id: string
  memberNumber: string
  fullNameEnglish: string | null
  fullNameBangla: string | null
  phoneNumber: string | null
  email: string | null
  sex: string | null
  dateOfBirth: string | null
  nid: string | null
  bloodGroup: string | null
  fatherName: string | null
  motherName: string | null
  occupation: string | null
  institute: string | null
  faculty: string | null
  address: string | null
  emergencyContact: string | null
  emergencyPhone: string | null
  picture: string | null
  beltRank: string | null
  studentLevel: string | null
  isActive: boolean
  isProfileComplete?: boolean
  hasAccount?: boolean
  joinDate: string | null
}

type MembersResponse = {
  members: Member[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function Members() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [message, setMessage] = React.useState<string | null>(null)

  const [members, setMembers] = React.useState<Member[]>([])
  const [page, setPage] = React.useState(1)
  const [search, setSearch] = React.useState('')
  const [status, setStatus] = React.useState<'all' | 'active' | 'inactive'>('all')
  const [pagination, setPagination] = React.useState<MembersResponse['pagination']>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })

  const [open, setOpen] = React.useState(false)
  const [editOpen, setEditOpen] = React.useState(false)
  const [editingMember, setEditingMember] = React.useState<Member | null>(null)

  const fetchMembers = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search.trim()) params.set('search', search.trim())
      if (status !== 'all') params.set('status', status)
      const data = await apiJSON<MembersResponse>(`/api/partner-portal/members?${params.toString()}`)
      setMembers(data.members || [])
      setPagination(data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [page, search, status])

  React.useEffect(() => {
    setPage(1)
  }, [status])

  React.useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const onCreate = async (form: any) => {
    setError(null)
    try {
      const payload = {
        fullNameEnglish: form.fullNameEnglish.trim(),
        fullNameBangla: form.fullNameBangla.trim() || null,
        phoneNumber: form.phoneNumber.trim(),
        email: form.email.trim(),
        password: form.password.trim(),
        sex: form.sex,
        dateOfBirth: form.dateOfBirth,
        nid: form.nid.trim() || null,
        occupation: form.occupation.trim() || null,
        institute: form.institute.trim() || null,
        faculty: form.faculty.trim() || null,
        address: form.address.trim() || null,
        emergencyContact: form.emergencyContact.trim() || null,
        emergencyPhone: form.emergencyPhone.trim() || null,
        bloodGroup: form.bloodGroup.trim() || null,
        fatherName: form.fatherName.trim() || null,
        motherName: form.motherName.trim() || null,
        agreement: form.agreement,
      }
      const data = await apiJSON<{ member: { memberNumber: string } }>(
        '/api/partner-portal/members',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      )
      setMessage(`Member created: ${data.member.memberNumber}`)
      setOpen(false)
      await fetchMembers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create member')
      throw e
    }
  }

  const onEdit = (member: Member) => {
    setEditingMember(member)
    setEditOpen(true)
  }

  const onUpdate = async (form: any) => {
    if (!editingMember) return
    setError(null)
    try {
      const payload = {
        memberId: editingMember.id,
        fullNameEnglish: form.fullNameEnglish.trim(),
        fullNameBangla: form.fullNameBangla.trim() || null,
        phoneNumber: form.phoneNumber.trim(),
        beltRank: form.beltRank,
        sex: form.sex,
        dateOfBirth: form.dateOfBirth,
        nid: form.nid.trim() || null,
        occupation: form.occupation.trim() || null,
        institute: form.institute.trim() || null,
        faculty: form.faculty.trim() || null,
        address: form.address.trim() || null,
        emergencyContact: form.emergencyContact.trim() || null,
        emergencyPhone: form.emergencyPhone.trim() || null,
        bloodGroup: form.bloodGroup.trim() || null,
        fatherName: form.fatherName.trim() || null,
        motherName: form.motherName.trim() || null,
      }
      const data = await apiJSON<{ member: Member }>(
        '/api/partner-portal/members',
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      )
      setMessage(`Member updated: ${data.member.memberNumber}`)
      setEditOpen(false)
      setEditingMember(null)
      await fetchMembers()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update member')
      throw e
    }
  }

  const formatDate = (value: string | null) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground">{pagination.total} total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Member</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Member</DialogTitle>
              <DialogDescription>
                Add a new member with their onboarding details. A password reset email will be sent after creation.
              </DialogDescription>
            </DialogHeader>
            <MemberForm onSubmit={onCreate} />
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update member details. Email cannot be changed.
            </DialogDescription>
          </DialogHeader>
          {editingMember && <EditMemberForm member={editingMember} onSubmit={onUpdate} />}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Name, member no, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchMembers()
            }}
          />
        </div>
        <div className="w-full sm:w-56">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="sm:pt-7">
          <Button onClick={() => fetchMembers()} variant="secondary">
            Apply
          </Button>
        </div>
      </div>

      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr className="text-muted-foreground">
              <th className="px-3 py-2">Member #</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Phone</th>
              <th className="px-3 py-2">Belt</th>
              <th className="px-3 py-2">Level</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Joined</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">
                  No members found.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-3 py-2 font-medium text-foreground">{m.memberNumber}</td>
                  <td className="px-3 py-2">
                    <div className="text-foreground">{m.fullNameEnglish || m.fullNameBangla || '—'}</div>
                    {m.email ? <div className="text-xs text-muted-foreground">{m.email}</div> : null}
                  </td>
                  <td className="px-3 py-2">{m.phoneNumber || '—'}</td>
                  <td className="px-3 py-2">{m.beltRank || '—'}</td>
                  <td className="px-3 py-2">{m.studentLevel || '—'}</td>
                  <td className="px-3 py-2">{m.isActive ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2">{formatDate(m.joinDate)}</td>
                  <td className="px-3 py-2">
                    <Button variant="ghost" size="sm" onClick={() => onEdit(m)}>
                      Edit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages || 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={loading || (pagination.totalPages ? page >= pagination.totalPages : false)}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

interface MemberFormProps {
  onSubmit: (form: any) => Promise<void>
  className?: string
}

function MemberForm({ onSubmit, className }: MemberFormProps) {
  const [form, setForm] = React.useState({
    fullNameEnglish: '',
    fullNameBangla: '',
    phoneNumber: '',
    email: '',
    password: '',
    sex: '',
    dateOfBirth: '',
    nid: '',
    occupation: '',
    institute: '',
    faculty: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    bloodGroup: '',
    fatherName: '',
    motherName: '',
    agreement: false,
  })
  const [creating, setCreating] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await onSubmit(form)
      setForm({
        fullNameEnglish: '',
        fullNameBangla: '',
        phoneNumber: '',
        email: '',
        password: '',
        sex: '',
        dateOfBirth: '',
        nid: '',
        occupation: '',
        institute: '',
        faculty: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        bloodGroup: '',
        fatherName: '',
        motherName: '',
        agreement: false,
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className || ''}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullNameEnglish">Full name *</Label>
          <Input
            id="fullNameEnglish"
            required
            value={form.fullNameEnglish}
            onChange={(e) => setForm((p) => ({ ...p, fullNameEnglish: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullNameBangla">Bangla name</Label>
          <Input
            id="fullNameBangla"
            value={form.fullNameBangla}
            onChange={(e) => setForm((p) => ({ ...p, fullNameBangla: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phoneNumber">Phone *</Label>
          <Input
            id="phoneNumber"
            required
            value={form.phoneNumber}
            onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <Input
            id="password"
            type="password"
            required
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sex">Sex *</Label>
          <select
            id="sex"
            required
            value={form.sex}
            onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of birth *</Label>
          <Input
            id="dateOfBirth"
            type="date"
            required
            value={form.dateOfBirth}
            onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bloodGroup">Blood group</Label>
          <Input
            id="bloodGroup"
            value={form.bloodGroup}
            onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nid">Nid/ Birth certificate</Label>
          <Input
            id="nid"
            value={form.nid}
            onChange={(e) => setForm((p) => ({ ...p, nid: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="occupation">Occupation</Label>
          <Input
            id="occupation"
            value={form.occupation}
            onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="institute">Institute / School</Label>
          <Input
            id="institute"
            value={form.institute}
            onChange={(e) => setForm((p) => ({ ...p, institute: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="faculty">Faculty/ Class</Label>
          <Input
            id="faculty"
            value={form.faculty}
            onChange={(e) => setForm((p) => ({ ...p, faculty: e.target.value }))}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fatherName">Father&apos;s name</Label>
          <Input
            id="fatherName"
            value={form.fatherName}
            onChange={(e) => setForm((p) => ({ ...p, fatherName: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="motherName">Mother&apos;s name</Label>
          <Input
            id="motherName"
            value={form.motherName}
            onChange={(e) => setForm((p) => ({ ...p, motherName: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContact">Emergency contact</Label>
          <Input
            id="emergencyContact"
            value={form.emergencyContact}
            onChange={(e) => setForm((p) => ({ ...p, emergencyContact: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyPhone">Emergency phone</Label>
          <Input
            id="emergencyPhone"
            value={form.emergencyPhone}
            onChange={(e) => setForm((p) => ({ ...p, emergencyPhone: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="agreement"
          checked={form.agreement}
          onCheckedChange={(checked) => setForm((p) => ({ ...p, agreement: checked === true }))}
        />
        <Label htmlFor="agreement" className="text-sm leading-6">
          Member agrees to the terms and onboarding details are correct.
        </Label>
      </div>

      <Button type="submit" disabled={creating} className="w-full">
        {creating ? 'Creating…' : 'Create Member'}
      </Button>
    </form>
  )
}

interface EditMemberFormProps {
  member: Member
  onSubmit: (form: any) => Promise<void>
  className?: string
}

function EditMemberForm({ member, onSubmit, className }: EditMemberFormProps) {
  // Format dateOfBirth for HTML date input (requires YYYY-MM-DD format)
  const formatDateForInput = (dateStr: string | null): string => {
    if (!dateStr) return ''
    // Extract just the date part (YYYY-MM-DD) from ISO timestamp
    return dateStr.split('T')[0] || ''
  }

  const [form, setForm] = React.useState({
    fullNameEnglish: member.fullNameEnglish || '',
    fullNameBangla: member.fullNameBangla || '',
    phoneNumber: member.phoneNumber || '',
    beltRank: member.beltRank || '',
    sex: member.sex || '',
    dateOfBirth: formatDateForInput(member.dateOfBirth),
    nid: member.nid || '',
    occupation: member.occupation || '',
    institute: member.institute || '',
    faculty: member.faculty || '',
    address: member.address || '',
    emergencyContact: member.emergencyContact || '',
    emergencyPhone: member.emergencyPhone || '',
    bloodGroup: member.bloodGroup || '',
    fatherName: member.fatherName || '',
    motherName: member.motherName || '',
  })
  const [updating, setUpdating] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    try {
      await onSubmit(form)
    } finally {
      setUpdating(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className || ''}`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit_fullNameEnglish">Full name *</Label>
          <Input
            id="edit_fullNameEnglish"
            required
            value={form.fullNameEnglish}
            onChange={(e) => setForm((p) => ({ ...p, fullNameEnglish: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_fullNameBangla">Bangla name</Label>
          <Input
            id="edit_fullNameBangla"
            value={form.fullNameBangla}
            onChange={(e) => setForm((p) => ({ ...p, fullNameBangla: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_phoneNumber">Phone *</Label>
          <Input
            id="edit_phoneNumber"
            required
            value={form.phoneNumber}
            onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_beltRank">Belt rank</Label>
          <select
            id="edit_beltRank"
            value={form.beltRank}
            onChange={(e) => setForm((p) => ({ ...p, beltRank: e.target.value }))}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select belt rank</option>
            <option value="white">White</option>
            <option value="yellow">Yellow</option>
            <option value="orange">Orange</option>
            <option value="green">Green</option>
            <option value="blue">Blue</option>
            <option value="purple">Purple</option>
            <option value="brown">Brown</option>
            <option value="red">Red</option>
            <option value="black">Black</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_sex">Sex *</Label>
          <select
            id="edit_sex"
            required
            value={form.sex}
            onChange={(e) => setForm((p) => ({ ...p, sex: e.target.value }))}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="">Select sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_dateOfBirth">Date of birth *</Label>
          <Input
            id="edit_dateOfBirth"
            type="date"
            required
            value={form.dateOfBirth}
            onChange={(e) => setForm((p) => ({ ...p, dateOfBirth: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_bloodGroup">Blood group</Label>
          <Input
            id="edit_bloodGroup"
            value={form.bloodGroup}
            onChange={(e) => setForm((p) => ({ ...p, bloodGroup: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_nid">Nid/ Birth certificate</Label>
          <Input
            id="edit_nid"
            value={form.nid}
            onChange={(e) => setForm((p) => ({ ...p, nid: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_occupation">Occupation</Label>
          <Input
            id="edit_occupation"
            value={form.occupation}
            onChange={(e) => setForm((p) => ({ ...p, occupation: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_institute">Institute / School</Label>
          <Input
            id="edit_institute"
            value={form.institute}
            onChange={(e) => setForm((p) => ({ ...p, institute: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_faculty">Faculty/ Class</Label>
          <Input
            id="edit_faculty"
            value={form.faculty}
            onChange={(e) => setForm((p) => ({ ...p, faculty: e.target.value }))}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="edit_address">Address</Label>
          <Input
            id="edit_address"
            value={form.address}
            onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_fatherName">Father&apos;s name</Label>
          <Input
            id="edit_fatherName"
            value={form.fatherName}
            onChange={(e) => setForm((p) => ({ ...p, fatherName: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_motherName">Mother&apos;s name</Label>
          <Input
            id="edit_motherName"
            value={form.motherName}
            onChange={(e) => setForm((p) => ({ ...p, motherName: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_emergencyContact">Emergency contact</Label>
          <Input
            id="edit_emergencyContact"
            value={form.emergencyContact}
            onChange={(e) => setForm((p) => ({ ...p, emergencyContact: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit_emergencyPhone">Emergency phone</Label>
          <Input
            id="edit_emergencyPhone"
            value={form.emergencyPhone}
            onChange={(e) => setForm((p) => ({ ...p, emergencyPhone: e.target.value }))}
          />
        </div>
      </div>

      <Button type="submit" disabled={updating} className="w-full">
        {updating ? 'Updating…' : 'Update Member'}
      </Button>
    </form>
  )
}
