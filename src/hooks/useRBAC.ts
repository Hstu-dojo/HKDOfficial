'use client';

import { useSession } from 'next-auth/react';
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
  const { data: session, status } = useSession();
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.id) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    // Fetch user permissions from the API
    async function fetchPermissions() {
      try {
        const response = await fetch(`/api/rbac/user-permissions/${session!.user!.id}`);
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
  }, [session, status]);

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
