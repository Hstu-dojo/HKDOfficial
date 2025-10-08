'use client'

import { useAuth } from '@/context/AuthContext'
import { useSession } from '@/hooks/useSessionCompat'

export default function AuthDebugPage() {
  const { user, session: authSession, loading } = useAuth()
  const { data: session, status } = useSession()

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Auth Debug Information</h1>
      
      <div className="space-y-6">
        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">useAuth() Raw Data:</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ user, authSession, loading }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">useSession() Compatibility Layer:</h2>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
            {JSON.stringify({ session, status }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-bold mb-2">Status Summary:</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Loading: {loading ? 'Yes' : 'No'}</li>
            <li>User Authenticated: {user ? 'Yes' : 'No'}</li>
            <li>Session Exists: {authSession ? 'Yes' : 'No'}</li>
            <li>Compatibility Status: {status}</li>
            <li>User Email: {user?.email || 'N/A'}</li>
            <li>Email Confirmed: {user?.email_confirmed_at ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}