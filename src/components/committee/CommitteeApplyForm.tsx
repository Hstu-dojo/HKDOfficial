'use client';

import { useState } from 'react';
import { applyForCommittee, updateCommitteeApplication } from '@/actions/committee-actions';
import { toast } from 'sonner';

interface PrefillData {
  username?: string;
  email?: string;
  phone?: string;
  institute?: string;
  dept?: string;
  profileId?: string;
  address?: string;
  nid?: string;
  picture?: string;
}

interface ExistingApplication {
  id: string;
  status: string;
  committeeId: string;
  institution?: string | null;
  department?: string | null;
  statement?: string | null;
  additionalData?: Record<string, any> | null;
}

interface CommitteeApplyFormProps {
  committeeId: string;
  prefill?: PrefillData | null;
  isLoggedIn: boolean;
  existingApplication?: ExistingApplication | null;
  committeeYear?: string | null;
}

export default function CommitteeApplyForm({
  committeeId,
  prefill,
  isLoggedIn,
  existingApplication,
  committeeYear,
}: CommitteeApplyFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [institution, setInstitution] = useState(existingApplication?.institution || prefill?.institute || '');
  const [department, setDepartment] = useState(existingApplication?.department || prefill?.dept || '');
  const [statement, setStatement] = useState(existingApplication?.statement || '');
  const [phone, setPhone] = useState(existingApplication?.additionalData?.phone || prefill?.phone || '');
  const [address, setAddress] = useState(existingApplication?.additionalData?.address || prefill?.address || '');
  const [nid, setNid] = useState(existingApplication?.additionalData?.nid || prefill?.nid || '');
  const [photoUrl, setPhotoUrl] = useState(
    existingApplication?.additionalData?.photoUrl || prefill?.picture || ''
  );
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoFileName, setPhotoFileName] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please log in to apply.');
      return;
    }
    if (!institution.trim() || !department.trim() || !phone.trim() || !address.trim() || !nid.trim() || !photoUrl.trim()) {
      toast.error('Please fill all required fields: Institution, Faculty / Department, Phone, NID, Address, Photo.');
      return;
    }

    setSubmitting(true);
    const payload = {
      institution: institution.trim(),
      department: department.trim(),
      statement: statement.trim(),
      additionalData: {
        name: prefill?.username,
        email: prefill?.email,
        phone,
        address,
        nid,
        photoUrl: photoUrl || undefined,
      },
      photoUrl: photoUrl || undefined,
    };

    const result = existingApplication
      ? await updateCommitteeApplication(existingApplication.id, payload)
      : await applyForCommittee({
          committeeId,
          profileId: prefill?.profileId || '',
          institution: payload.institution,
          department: payload.department,
          statement: payload.statement,
          additionalData: payload.additionalData,
        });
    setSubmitting(false);

    if (result.success) {
      toast.success(existingApplication ? 'Application updated successfully.' : 'Application submitted successfully.');
      if (!existingApplication) {
        setStatement('');
      }
    } else {
      toast.error(result.error || 'Failed to submit application.');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error('File too large. Max 4MB.');
      return;
    }

    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/enrollments/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl, type: 'photo', courseId: 'committee' }),
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const result = await res.json();
      setPhotoUrl(result.secureUrl);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Apply for Committee</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
        Submit your application to join the committee for this year.
      </p>

      {existingApplication && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          You already submitted this form for {committeeYear || 'this year'}.
          <span className="ml-2 font-medium">Status: {existingApplication.status}</span>
        </div>
      )}

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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">NID</label>
          <input
            value={nid}
            onChange={(e) => setNid(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            placeholder="National ID"
          />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Institution</label>
            <input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder="University / College"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Faculty / Department</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              placeholder="Faculty / Department Name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
            placeholder="Current address"
          />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Profile Photo</label>
          <div className="mt-2 flex items-center gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile"
                className="h-20 w-20 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                No Photo
              </div>
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhotoFileName(file.name);
                    handlePhotoUpload(file);
                  }
                }}
                className="block text-sm text-gray-600"
              />
              {photoUploading && (
                <p className="text-xs text-gray-500 mt-1">Uploading...</p>
              )}
              {!photoUploading && photoFileName && (
                <p className="text-xs text-gray-500 mt-1">{photoFileName}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Upload a recent passport-sized photo. If you already have a profile photo, you can replace it here.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || !isLoggedIn}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : existingApplication ? 'Update Application' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
}
