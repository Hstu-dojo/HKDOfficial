import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/connect-db';
import { user as userSchema, userRole, role, partners, members } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function PartnerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get the user's partner role and associated partner
  const publicUser = await db.query.user.findFirst({
    where: eq(userSchema.supabaseUserId, user.id),
  });

  if (!publicUser) {
    redirect('/dashboard');
  }

  // Check if user has PARTNER role
  const userRoles = await db
    .select({ roleName: role.name })
    .from(userRole)
    .innerJoin(role, eq(userRole.roleId, role.id))
    .where(and(
      eq(userRole.userId, publicUser.id),
      eq(userRole.isActive, true)
    ));

  const hasPartnerRole = userRoles.some(r => r.roleName === 'PARTNER');

  if (!hasPartnerRole) {
    redirect('/dashboard');
  }

  // For now, we'll assume the first partner - in production, you'd link users to specific partners
  const allPartners = await db.query.partners.findMany({
    where: eq(partners.isActive, true),
    limit: 1,
  });

  const partner = allPartners[0];

  if (!partner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Partner Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            No partner association found for your account.
          </p>
        </div>
      </div>
    );
  }

  // Get students associated with this partner
  const partnerStudents = await db.query.members.findMany({
    where: eq(members.partnerId, partner.id),
  });

  const activeStudents = partnerStudents.filter(s => s.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
          Partner Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Manage your venue and students
        </p>
      </div>

      {/* Partner Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{partner.name}</CardTitle>
          <CardDescription>{partner.location}</CardDescription>
        </CardHeader>
        <CardContent>
          {partner.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {partner.description}
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {partner.contactEmail && (
              <div>
                <span className="text-slate-500">Email:</span>
                <p className="font-medium">{partner.contactEmail}</p>
              </div>
            )}
            {partner.contactPhone && (
              <div>
                <span className="text-slate-500">Phone:</span>
                <p className="font-medium">{partner.contactPhone}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{partnerStudents.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{activeStudents.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inactive Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-500">
              {partnerStudents.length - activeStudents.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your partner venue</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/dashboard/partner/students"
              className="block p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                Manage Students
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                View and manage your venue's students
              </p>
            </a>

            <a
              href="/dashboard/partner/bills"
              className="block p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                View Bills
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Check your billing history and payments
              </p>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Recent Students */}
      {partnerStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Students</CardTitle>
            <CardDescription>Latest students enrolled at your venue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {partnerStudents.slice(0, 5).map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {student.fullNameEnglish || 'N/A'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Member #{student.memberNumber}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs rounded-full',
                      student.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200'
                    )}
                  >
                    {student.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
