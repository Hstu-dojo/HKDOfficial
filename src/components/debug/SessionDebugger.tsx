'use client';

import { useCompleteSession } from '@/hooks/useCompleteSession';
import { useSession } from '@/hooks/useSessionCompat';

export function SessionDebugger() {
  const originalSession = useSession();
  const completeSession = useCompleteSession();

  return (
    <div className="space-y-4 p-4 bg-gray-100 rounded-lg">
      <div>
        <h3 className="font-bold text-sm">Supabase Session (via useSessionCompat):</h3>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(originalSession.data, null, 2)}
        </pre>
        <p className="text-xs">Status: {originalSession.status}</p>
      </div>
      
      <div>
        <h3 className="font-bold text-sm">Complete useSession:</h3>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(completeSession.data, null, 2)}
        </pre>
        <p className="text-xs">Status: {completeSession.status}</p>
        <p className="text-xs">Has Complete Data: {completeSession.hasCompleteData ? 'Yes' : 'No'}</p>
        <p className="text-xs">Loading: {completeSession.isLoading ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
}
