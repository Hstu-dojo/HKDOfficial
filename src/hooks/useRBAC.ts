'use client';

import { useCompleteSession } from './useCompleteSession';
import { useState, useEffect, useCallback } from 'react';
import type { ResourceType, ActionType } from '@/lib/rbac/types';

interface UserPermissions {
  roles: Array<{
    id: string;
    name: string;
    description?: string;
    isActive?: boolean;
  }>;
  permissions: Array<{
    resource: ResourceType;
    action: ActionType;
  }>;
}

export function useRBAC() {
  const { data: session, status, hasCompleteData } = useCompleteSession();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [localUserId, setLocalUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch RBAC data using the Supabase user ID via header
  // This avoids cookie issues that can occur with getRBACContext
  useEffect(() => {
    if (status === 'loading' || !hasCompleteData) {
      setLoading(true);
      return;
    }
    
    if (!session?.user?.id) {
      setLocalUserId(null);
      setPermissions(null);
      setLoading(false);
      return;
    }

    async function fetchRBACData() {
      try {
        setLoading(true);
        console.log('[useRBAC] Fetching RBAC data for Supabase ID:', session!.user!.id);
        
        // Use the dedicated API endpoint that accepts Supabase ID via header
        const response = await fetch('/api/auth/get-user-rbac', {
          method: 'GET',
          headers: {
            'x-supabase-user-id': session!.user!.id,
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[useRBAC] Got RBAC data:', data);
          
          setLocalUserId(data.localUserId);
          setPermissions({
            roles: data.roles || [],
            permissions: (data.permissions || []).map((perm: any) => ({
              resource: perm.resource,
              action: perm.action,
            })),
          });
          setError(null);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('[useRBAC] Failed to fetch RBAC data:', response.status, errorData);
          setLocalUserId(null);
          setPermissions(null);
          setError(`Failed to fetch RBAC data: ${errorData.error || response.statusText}`);
        }
      } catch (err) {
        console.error('[useRBAC] Error fetching RBAC data:', err);
        setLocalUserId(null);
        setPermissions(null);
        setError('Network error fetching RBAC data');
      } finally {
        setLoading(false);
      }
    }

    fetchRBACData();
  }, [session, status, hasCompleteData]);

  const hasPermission = useCallback((resource: ResourceType, action: ActionType): boolean => {
    if (!permissions) return false;
    
    return permissions.permissions.some(
      (perm) => perm.resource === resource && (perm.action === action || perm.action === 'MANAGE')
    );
  }, [permissions]);

  const hasRole = useCallback((roleName: string): boolean => {
    if (!permissions) return false;
    
    return permissions.roles.some(r => r.name === roleName);
  }, [permissions]);

  const hasAnyRole = useCallback((roleNames: string[]): boolean => {
    if (!permissions) return false;
    
    return roleNames.some(role => permissions.roles.some(r => r.name === role));
  }, [permissions]);

  const hasAllRoles = useCallback((roleNames: string[]): boolean => {
    if (!permissions) return false;
    
    return roleNames.every(role => permissions.roles.some(r => r.name === role));
  }, [permissions]);

  return {
    permissions,
    loading,
    error,
    localUserId,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAuthenticated: !!session?.user,
    user: session?.user || null,
  };
}
