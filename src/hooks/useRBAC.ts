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

  // First, get the local user ID from Supabase user ID
  useEffect(() => {
    if (status === 'loading' || !hasCompleteData) {
      return;
    }
    
    if (!session?.user?.id) {
      setLocalUserId(null);
      setLoading(false);
      return;
    }

    async function getLocalUserId() {
      try {
        const response = await fetch(`/api/auth/get-local-user-id?supabaseId=${session!.user!.id}`);
        if (response.ok) {
          const data = await response.json();
          setLocalUserId(data.localUserId);
          setError(null);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to get local user ID:', response.status, errorData);
          setLocalUserId(null);
          setError(`Failed to get local user ID: ${errorData.error || response.statusText}`);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error getting local user ID:', err);
        setLocalUserId(null);
        setError('Network error getting local user ID');
        setLoading(false);
      }
    }

    getLocalUserId();
  }, [session, status, hasCompleteData]);

  // Then fetch permissions using the local user ID
  useEffect(() => {
    if (status === 'loading' || !hasCompleteData) {
      setLoading(true);
      return;
    }
    
    if (!localUserId) {
      // Only set loading false if we've already tried to get local user ID
      if (session?.user?.id && !loading) {
        setPermissions(null);
      }
      return;
    }

    // Fetch user permissions from the API using local user ID
    async function fetchPermissions() {
      try {
        setLoading(true);
        const response = await fetch(`/api/rbac/user-permissions/${localUserId}`);
        if (response.ok) {
          const data = await response.json();
          // Transform the data to match expected format
          const transformedData: UserPermissions = {
            roles: data.userPermissions.roles.map((role: any) => ({
              id: role.id,
              name: role.name,
              description: role.description,
              isActive: role.isActive,
            })),
            permissions: data.userPermissions.permissions.map((perm: any) => ({
              resource: perm.resource,
              action: perm.action,
            })),
          };
          setPermissions(transformedData);
          setError(null);
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Failed to fetch user permissions:', response.status, errorData);
          setPermissions(null);
          setError(`Failed to fetch permissions: ${errorData.error || response.statusText}`);
        }
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setPermissions(null);
        setError('Network error fetching permissions');
      } finally {
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [localUserId, status, hasCompleteData, session?.user?.id]);

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
