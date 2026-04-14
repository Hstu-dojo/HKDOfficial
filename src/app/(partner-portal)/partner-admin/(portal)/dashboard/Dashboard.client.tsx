'use client'

import * as React from 'react'
import { apiJSON } from '../_lib/api.client'

type ProfileResponse = {
  partner: {
    name: string
    slug: string
    location: string | null
    contactEmail: string | null
  }
  stats: {
    totalMembers: number
    totalCourses: number
  }
}

export default function Dashboard() {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [data, setData] = React.useState<ProfileResponse | null>(null)

  React.useEffect(() => {
    let mounted = true
    setLoading(true)
    apiJSON<ProfileResponse>('/api/partner-portal/profile')
      .then((d) => mounted && setData(d))
      .catch((e) => mounted && setError(e instanceof Error ? e.message : 'Failed to load dashboard'))
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (error) return <p className="text-sm text-destructive">{error}</p>
  if (!data) return <p className="text-sm text-destructive">No data</p>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">/org/{data.partner.slug}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-md border p-4">
          <div className="text-sm text-muted-foreground">Members</div>
          <div className="text-2xl font-semibold text-foreground">{data.stats.totalMembers}</div>
        </div>
        <div className="rounded-md border p-4">
          <div className="text-sm text-muted-foreground">Active Courses</div>
          <div className="text-2xl font-semibold text-foreground">{data.stats.totalCourses}</div>
        </div>
      </div>

      <div className="rounded-md border p-4">
        <div className="text-sm font-medium text-foreground">Organization</div>
        <div className="mt-2 grid grid-cols-1 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Name:</span> {data.partner.name}
          </div>
          {data.partner.location ? (
            <div>
              <span className="text-muted-foreground">Location:</span> {data.partner.location}
            </div>
          ) : null}
          {data.partner.contactEmail ? (
            <div>
              <span className="text-muted-foreground">Contact:</span> {data.partner.contactEmail}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
