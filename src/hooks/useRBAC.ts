'use client';

import { useCompleteSession } from './useCompleteSession';
import { useState, useEffect, useCallback, useRef } from 'react';
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

  // Track the user ID we've already fetched RBAC data for,
  // so we don't re-fetch on token refreshes or session reference changes.
  const lastFetchedUserIdRef = useRef<string | null>(null);

  // Derive a stable user ID to use as the effect dependency
  // instead of the entire session object (which changes on every token refresh)
  const userId = session?.user?.id ?? null;

  // Fetch RBAC data using the Supabase user ID via header
  // This avoids cookie issues that can occur with getRBACContext
  useEffect(() => {
    if (status === 'loading' || !hasCompleteData) {
      // Only show loading if we don't already have cached data for this user
      if (!lastFetchedUserIdRef.current || lastFetchedUserIdRef.current !== userId) {
        setLoading(true);
      }
      return;
    }
    
    if (!userId) {
      lastFetchedUserIdRef.current = null;
      setLocalUserId(null);
      setPermissions(null);
      setLoading(false);
      return;
    }

    // Skip re-fetch if we already have RBAC data for this exact user
    if (lastFetchedUserIdRef.current === userId && permissions !== null) {
      setLoading(false);
      return;
    }

    async function fetchRBACData() {
      try {
        // Don't show loading spinner if we already have cached permissions
        // (allows background refresh without UI flash)
        if (!lastFetchedUserIdRef.current) {
          setLoading(true);
        }
        
        // The API now validates the Supabase session via cookies (server-side).
        // No need to send user ID as a header — it's derived from the session.
        const response = await fetch('/api/auth/get-user-rbac', {
          method: 'GET',
          credentials: 'same-origin',
        });

        if (response.ok) {
          const data = await response.json();
          console.log('[useRBAC] Got RBAC data:', data);
          
          lastFetchedUserIdRef.current = userId;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, status, hasCompleteData]);

  const hasPermission = useCallback((resource: ResourceType, action: ActionType): boolean => {
    if (!permissions) return false;
    
    // SUPER_ADMIN has all permissions
    if (permissions.roles.some(r => r.name === 'SUPER_ADMIN')) {
      return true;
    }
    
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
