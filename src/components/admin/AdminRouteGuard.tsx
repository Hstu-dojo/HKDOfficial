import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from "next/navigation";
import { getUserPermissions, hasRole } from "@/lib/rbac/permissions";

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

  try {
    // Check for basic admin access
    const isAdmin = await hasRole(session.user.id, 'SUPER_ADMIN') ||
                   await hasRole(session.user.id, 'ADMIN') ||
                   await hasRole(session.user.id, 'MODERATOR') ||
                   await hasRole(session.user.id, 'INSTRUCTOR');

    if (!isAdmin) {
      redirect('/unauthorized');
    }

    // Check for specific role if required
    if (requiredRole) {
      const hasRequiredRole = await hasRole(session.user.id, requiredRole);
      if (!hasRequiredRole) {
        redirect('/unauthorized');
      }
    }

    // Check for specific permission if required
    if (requiredPermission) {
      const userPermissions = await getUserPermissions(session.user.id);
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
