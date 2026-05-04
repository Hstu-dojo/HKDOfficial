'use client';

import { useState } from 'react';
import { applyForCommittee } from '@/actions/committee-actions';
import { toast } from 'sonner';

interface PrefillData {
  username?: string;
  email?: string;
  phone?: string;
  institute?: string;
  dept?: string;
  profileId?: string;
}

interface CommitteeApplyFormProps {
  committeeId: string;
  prefill?: PrefillData | null;
  isLoggedIn: boolean;
}

export default function CommitteeApplyForm({ committeeId, prefill, isLoggedIn }: CommitteeApplyFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [institution, setInstitution] = useState(prefill?.institute || '');
  const [department, setDepartment] = useState(prefill?.dept || '');
  const [statement, setStatement] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please log in to apply.');
      return;
    }
    if (!institution.trim() || !department.trim()) {
      toast.error('Institution and department are required.');
      return;
    }

    setSubmitting(true);
    const result = await applyForCommittee({
      committeeId,
      profileId: prefill?.profileId || '',
      institution: institution.trim(),
      department: department.trim(),
      statement: statement.trim(),
      additionalData: {
        name: prefill?.username,
        email: prefill?.email,
        phone: prefill?.phone,
      },
    });
    setSubmitting(false);

    if (result.success) {
      toast.success('Application submitted successfully.');
      setStatement('');
    } else {
      toast.error(result.error || 'Failed to submit application.');
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Apply for Committee</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Submit your application to join the committee for this year.
      </p>

      {!isLoggedIn && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          Please log in and complete onboarding to apply.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
            <input
              value={prefill?.username || ''}
              disabled
              className="mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              value={prefill?.email || ''}
              disabled
              className="mt-1 w-full rounded-md border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-700 dark:text-gray-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Institution</label>
            <input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder="University / College"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder="Department Name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Statement</label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            rows={4}
            placeholder="Why do you want to join the committee?"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !isLoggedIn}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
