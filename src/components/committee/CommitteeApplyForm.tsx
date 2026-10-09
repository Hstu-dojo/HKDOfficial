'use client';

import { useState } from 'react';
import { applyForCommittee, updateCommitteeApplication } from '@/actions/committee-actions';
import { toast } from 'sonner';
import { useScopedI18n } from '@/locales/client';

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
  const t = useScopedI18n('committeePage.form') as any;
  const statusKey: Record<string, string> = {
    pending: 'statusPending', approved: 'statusApproved', rejected: 'statusRejected', under_review: 'statusUnderReview',
  };
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
      toast.error(t('loginError'));
      return;
    }
    if (!institution.trim() || !department.trim() || !phone.trim() || !address.trim() || !nid.trim() || !photoUrl.trim()) {
      toast.error(t('requiredError'));
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
      toast.success(existingApplication ? t('updated') : t('submitted'));
      if (!existingApplication) {
        setStatement('');
      }
    } else {
      toast.error(result.error || t('failed'));
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('imageOnly'));
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t('tooLarge'));
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
        throw new Error(t('uploadFailed'));
      }

      const result = await res.json();
      setPhotoUrl(result.secureUrl);
      toast.success(t('uploaded'));
    } catch (error) {
      console.error(error);
      toast.error(t('uploadFailed'));
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <div className="rounded-xl border border-border dark:border-border bg-white dark:bg-background p-6">
      <h3 className="text-lg font-semibold text-foreground dark:text-gray-100">{t('title')}</h3>
      <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
        {t('description')}
      </p>

      {existingApplication && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {t('alreadySubmitted', { year: committeeYear || 'this year' })}
          <span className="ml-2 font-medium">{t('status')} {t(statusKey[existingApplication.status.toLowerCase()] || 'statusPending')}</span>
        </div>
      )}

      {!isLoggedIn && (
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {t('loginToApply')}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-gray-300">{t('name')}</label>
            <input
              value={prefill?.username || ''}
              disabled
              className="mt-1 w-full rounded-md border border-border dark:border-border bg-muted dark:bg-card px-3 py-2 text-sm text-foreground dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-gray-300">{t('email')}</label>
            <input
              value={prefill?.email || ''}
              disabled
              className="mt-1 w-full rounded-md border border-border dark:border-border bg-muted dark:bg-card px-3 py-2 text-sm text-foreground dark:text-gray-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-gray-300">{t('phone')}</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-background px-3 py-2 text-sm"
              placeholder={t('phonePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-gray-300">{t('nid')}</label>
          <input
            value={nid}
            onChange={(e) => setNid(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-background px-3 py-2 text-sm"
            placeholder={t('nidPlaceholder')}
          />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-gray-300">{t('institution')}</label>
            <input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-background px-3 py-2 text-sm"
              placeholder={t('institutionPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground dark:text-gray-300">{t('department')}</label>
            <input
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-background px-3 py-2 text-sm"
              placeholder={t('departmentPlaceholder')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-gray-300">{t('address')}</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-background px-3 py-2 text-sm"
            placeholder={t('addressPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-gray-300">{t('statement')}</label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-background px-3 py-2 text-sm"
            rows={4}
            placeholder={t('statementPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground dark:text-gray-300">{t('photo')}</label>
          <div className="mt-2 flex items-center gap-4">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={t('profileAlt')}
                className="h-20 w-20 rounded-lg object-cover border border-border"
              />
            ) : (
              <div className="h-20 w-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                {t('noPhoto')}
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
                className="block text-sm text-muted-foreground"
              />
              {photoUploading && (
                <p className="text-xs text-muted-foreground mt-1">{t('uploading')}</p>
              )}
              {!photoUploading && photoFileName && (
                <p className="text-xs text-muted-foreground mt-1">{photoFileName}</p>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t('photoHint')}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting || !isLoggedIn}
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? t('submitting') : existingApplication ? t('update') : t('submit')}
        </button>
      </form>
    </div>
  );
}
