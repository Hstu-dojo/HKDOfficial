'use client'

import { useAuth } from '@/context/AuthContext'
import { useSession } from '@/hooks/useSessionCompat'
import { useScopedI18n } from '@/locales/client'

export default function AuthDebugPage() {
  const t = useScopedI18n('auth.debug')
  const { user, session: authSession, loading } = useAuth()
  const { data: session, status } = useSession()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>
      
      <div className="space-y-6">
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">{t('useAuthRaw')}</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ user, authSession, loading }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">{t('useSessionCompat')}</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ session, status }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">{t('statusSummary')}</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>{t('labels.loading')} {loading ? t('yes') : t('no')}</li>
            <li>{t('labels.userAuthenticated')} {user ? t('yes') : t('no')}</li>
            <li>{t('labels.sessionExists')} {authSession ? t('yes') : t('no')}</li>
            <li>{t('labels.compatibilityStatus')} {status}</li>
            <li>{t('labels.userEmail')} {user?.email || t('notAvailable')}</li>
            <li>{t('labels.emailConfirmed')} {user?.email_confirmed_at ? t('yes') : t('no')}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}