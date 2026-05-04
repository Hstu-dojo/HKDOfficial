import Link from 'next/link';
import CommitteeIdCard from '@/components/committee/CommitteeIdCard';
import { getMyCommitteeStatus } from '@/actions/committee-actions';

export default async function DashboardCommitteePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const result = await getMyCommitteeStatus();

  if (!result.success) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">My Committee Status</h1>
        <p className="text-sm text-red-600">{result.error || 'Unable to load committee status.'}</p>
      </div>
    );
  }

  const data = result.data;
  const current = data?.current || null;
  const history = data?.history || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Committee Status</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Track your committee application and membership history.
        </p>
      </div>

      {current ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Current Committee</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{current.committee?.title}</p>
            <div className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div><span className="font-medium">Status:</span> {current.status}</div>
              <div><span className="font-medium">Position:</span> {current.positionTitle || '—'}</div>
              <div><span className="font-medium">Year:</span> {current.committee?.year || '—'}</div>
            </div>
          </div>

          {current.status === 'approved' && (
            <CommitteeIdCard
              name={current.profile?.fullNameEnglish || current.user?.userName || 'Member'}
              position={current.positionTitle || 'Committee Member'}
              committeeTitle={current.committee?.title || 'Committee'}
              year={current.committee?.year || ''}
              memberNumber={current.profile?.memberNumber || null}
              photoUrl={current.profile?.picture || current.additionalData?.photoUrl || null}
              trainerSignature={current.committee?.trainerSignature || null}
            />
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No Active Committee</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You have no active committee application yet.
          </p>
          <Link
            href={`/${locale}/committee`}
            className="inline-flex mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Apply Now
          </Link>
        </div>
      )}

      {history.length > 0 && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Committee History</h2>
          <div className="mt-4 space-y-3">
            {history.map((item: any) => (
              <div
                key={item.id}
                className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {item.committee?.title || 'Committee'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Year {item.committee?.year || '—'}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                    {item.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">Position: {item.positionTitle || '—'}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}