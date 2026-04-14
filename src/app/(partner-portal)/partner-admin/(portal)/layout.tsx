import { redirect } from 'next/navigation'
import { getPayloadPartnerUser } from '@/lib/payload/auth'
import PortalShell from './_components/PortalShell.client'

export const dynamic = 'force-dynamic'

export default async function PartnerAdminPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getPayloadPartnerUser()
  if (!user) redirect('/partner-admin/login?next=/partner-admin')

  return (
    <PortalShell
      partnerName={user.partnerName}
      partnerSlug={user.partnerSlug}
      userName={user.name || user.email}
    >
      {children}
    </PortalShell>
  )
}
