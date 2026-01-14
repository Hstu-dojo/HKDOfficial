'use client';

import { useCompleteSession } from './useCompleteSession';
import { useState, useEffect } from 'react';
import type { ResourceType, ActionType } from '@/lib/rbac/types';

interface UserPermissions {
  roles: string[];
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

  // First, get the local user ID from Supabase user ID
  useEffect(() => {
    if (status === 'loading' || !hasCompleteData) {
      return;
    }
    
    if (!session?.user?.id) {
      setLocalUserId(null);
      return;
    }

    async function getLocalUserId() {
      try {
        const response = await fetch(`/api/auth/get-local-user-id?supabaseId=${session!.user!.id}`);
        if (response.ok) {
          const data = await response.json();
          setLocalUserId(data.localUserId);
        } else {
          console.error('Failed to get local user ID:', response.status, response.statusText);
          setLocalUserId(null);
        }
      } catch (error) {
        console.error('Error getting local user ID:', error);
        setLocalUserId(null);
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
      setPermissions(null);
      setLoading(false);
      return;
    }

    // Fetch user permissions from the API using local user ID
    async function fetchPermissions() {
      try {
        const response = await fetch(`/api/rbac/user-permissions/${localUserId}`);
        if (response.ok) {
          const data = await response.json();
          // Transform the data to match expected format
          const transformedData = {
            roles: data.userPermissions.roles.map((role: any) => role.name),
            permissions: data.userPermissions.permissions.map((perm: any) => ({
              resource: perm.resource,
              action: perm.action,
            })),
          };
          setPermissions(transformedData);
          setLoading(false);
        } else {
          console.error('Failed to fetch user permissions:', response.status, response.statusText);
          setPermissions(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching permissions:', error);
        setPermissions(null);
        setLoading(false);
      }
    }

    fetchPermissions();
  }, [localUserId, status, hasCompleteData]);

  const hasPermission = (resource: ResourceType, action: ActionType): boolean => {
    if (!permissions) return false;
    
    return permissions.permissions.some(
      (perm) => perm.resource === resource && (perm.action === action || perm.action === 'MANAGE')
    );
  };

  const hasRole = (roleName: string): boolean => {
    if (!permissions) return false;
    
    return permissions.roles.includes(roleName);
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    if (!permissions) return false;
    
    return roleNames.some(role => permissions.roles.includes(role));
  };

  const hasAllRoles = (roleNames: string[]): boolean => {
    if (!permissions) return false;
    
    return roleNames.every(role => permissions.roles.includes(role));
  };

  return {
    permissions,
    loading,
    hasPermission,
    hasRole,
    hasAnyRole,
    hasAllRoles,
    isAuthenticated: !!session?.user,
    user: session?.user || null,
  };
}
