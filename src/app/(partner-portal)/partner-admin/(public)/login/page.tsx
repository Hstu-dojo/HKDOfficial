import { redirect } from 'next/navigation'
import { getPayloadPartnerUser } from '@/lib/payload/auth'
import LoginForm from './LoginForm.client'

export const dynamic = 'force-dynamic'

export default async function PartnerAdminLoginPage() {
  const user = await getPayloadPartnerUser()
  if (user) redirect('/partner-admin')

  return (
    <div className="min-h-[calc(100vh-2rem)] p-6 flex items-center justify-center">
      <LoginForm />
    </div>
  )
}
