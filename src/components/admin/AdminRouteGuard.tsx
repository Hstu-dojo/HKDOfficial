import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import { getUserPermissions, hasRole } from "@/lib/rbac/permissions";
import { getLocalUserId } from "@/lib/rbac/middleware";
import { ADMIN_ROLES } from "@/lib/rbac/constants";

interface AdminRouteGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: {
    resource: string;
    action: string;
  };
}

export async function AdminRouteGuard({ 
  children, 
  requiredRole, 
  requiredPermission 
}: AdminRouteGuardProps) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
  const { data: { session }, error } = await supabase.auth.getSession();

  // Redirect if not authenticated
  if (error || !session?.user?.id) {
    redirect('/login?callbackUrl=/admin');
  }

  // Get local DB user ID from Supabase user ID
  const localUserId = await getLocalUserId(session.user.id);
  
  if (!localUserId) {
    console.error('Local user not found for Supabase ID:', session.user.id);
    redirect('/login?callbackUrl=/admin&error=user_not_found');
  }

  try {
    // Check for basic admin access using local user ID
    const roleChecks = await Promise.all(
      ADMIN_ROLES.map((role) => hasRole(localUserId, role))
    );
    const isAdmin = roleChecks.some(Boolean);

    if (!isAdmin) {
      redirect('/unauthorized');
    }

    // Check for specific role if required
    if (requiredRole) {
      const hasRequiredRole = await hasRole(localUserId, requiredRole);
      if (!hasRequiredRole) {
        redirect('/unauthorized');
      }
    }

    // Check for specific permission if required
    if (requiredPermission) {
      const userPermissions = await getUserPermissions(localUserId);
      const hasRequiredPermission = userPermissions.permissions.some(
        (p) => p.resource === requiredPermission.resource && 
               (p.action === requiredPermission.action || p.action === 'MANAGE')
      );
      
      if (!hasRequiredPermission) {
        redirect('/unauthorized');
      }
    }

    return <>{children}</>;
  } catch (error) {
    console.error('Admin route guard error:', error);
    redirect('/unauthorized');
  }
}
