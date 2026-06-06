'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Image from 'next/image';
import {
  XMarkIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { FORM_SECTIONS, FORM_FIELDS } from '@/lib/pdf/form-fields';
import { downloadEnrollmentFormPdf } from '@/lib/pdf/pdf-utils';
import { toast } from 'sonner';

interface EnrollmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  courseId: string;
  courseName: string;
  initialStudentInfo: any;
  status: string;
  onSave: (updatedStudentInfo: any) => Promise<void>;
  paymentInfo?: {
    method?: string | null;
    transactionId?: string | null;
    proofUrl?: string | null;
    amount?: number | null;
    currency?: string;
  };
}

export default function EnrollmentFormModal({
  isOpen,
  onClose,
  applicationId,
  courseId,
  courseName,
  initialStudentInfo,
  status,
  onSave,
  paymentInfo,
}: EnrollmentFormModalProps) {
  const [activeTab, setActiveTab] = useState<'form' | 'files'>('form');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Sync state with props or fetch if null
  useEffect(() => {
    if (isOpen) {
      if (initialStudentInfo) {
        setFormData({ ...initialStudentInfo });
      } else if (applicationId) {
        setLoading(true);
        fetch(`/api/enrollments/${applicationId}/form-data`)
          .then((res) => {
            if (!res.ok) throw new Error('Failed to load form data');
            return res.json();
          })
          .then((data) => {
            setFormData(data.formData || {});
          })
          .catch((err) => {
            console.error(err);
            toast.error('Could not load enrollment form details');
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  }, [isOpen, initialStudentInfo, applicationId]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadEnrollmentFormPdf(applicationId, courseName);
      toast.success('Registration PDF downloaded successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF registration form');
    } finally {
      setDownloading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      setIsEditing(false);
      toast.success('Form details updated successfully');
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to update form details');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (fieldId: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-start sm:items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl max-h-[calc(100vh-2rem)] transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl transition-all flex flex-col border border-gray-100 dark:border-gray-700">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b dark:border-gray-700 flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      Student Enrollment Form
                    </Dialog.Title>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Course: <span className="font-semibold text-gray-700 dark:text-gray-300">{courseName}</span> · Status:{' '}
                      <span className="font-semibold capitalize text-blue-600 dark:text-blue-400">
                        {status.replace('_', ' ')}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownload}
                      disabled={downloading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 disabled:opacity-50 transition-colors"
                      title="Download filled PDF registration form"
                    >
                      {downloading ? (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <ArrowDownTrayIcon className="h-3.5 w-3.5" />
                      )}
                      Download PDF
                    </button>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg p-1"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b dark:border-gray-700 px-6 bg-white dark:bg-gray-800">
                  <button
                    onClick={() => setActiveTab('form')}
                    className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === 'form'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Form Fields
                  </button>
                  <button
                    onClick={() => setActiveTab('files')}
                    className={`py-3 px-4 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === 'files'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Photos & Payments
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 flex-1 overflow-y-auto space-y-8 bg-gray-50/50 dark:bg-gray-900/10">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-3">
                      <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading enrollment details...</p>
                    </div>
                  ) : activeTab === 'form' ? (
                    <div className="space-y-8">
                      {FORM_SECTIONS.filter(
                        (s) => s.id !== 'payment' && s.id !== 'review' && s.id !== 'images'
                      ).map((section) => (
                        <div key={section.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                          <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pb-2 border-b dark:border-gray-700 flex items-center">
                            {section.title} <span className="text-xs text-gray-400 dark:text-gray-500 ml-1.5">({section.titleBn})</span>
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {FORM_FIELDS.filter((f) => f.section === section.id).map((field) => {
                              const value = formData[field.id] || '';
                              return (
                                <div key={field.id} className="space-y-1">
                                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                                    {field.label}
                                    {field.required && <span className="text-red-500">*</span>}
                                  </label>
                                  {isEditing && !field.readOnly ? (
                                    field.type === 'textarea' ? (
                                      <textarea
                                        value={value}
                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                        className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                                        rows={2}
                                      />
                                    ) : field.type === 'select' ? (
                                      <select
                                        value={value}
                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                        className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                                      >
                                        <option value="">Select...</option>
                                        {field.options?.map((opt) => (
                                          <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <input
                                        type={field.type}
                                        value={value}
                                        onChange={(e) => handleChange(field.id, e.target.value)}
                                        className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                                      />
                                    )
                                  ) : (
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words min-h-[1.25rem]">
                                      {value || <span className="text-gray-300 dark:text-gray-600">—</span>}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Pictures */}
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pb-2 border-b dark:border-gray-700">
                          Photos & Attachments
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                              Profile Photo
                            </label>
                            {formData.profilePhotoUrl ? (
                              <a
                                href={formData.profilePhotoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group relative overflow-hidden rounded-lg border dark:border-gray-700 h-40 w-full"
                              >
                                <Image
                                  src={formData.profilePhotoUrl}
                                  alt="Profile"
                                  fill
                                  unoptimized
                                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-200">
                                  View Full Image
                                </div>
                              </a>
                            ) : (
                              <div className="h-40 rounded-lg border border-dashed dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center text-gray-400">
                                <span className="text-xs">No Photo</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 block mb-2">
                              Signature
                            </label>
                            {formData.signatureUrl ? (
                              <a
                                href={formData.signatureUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group relative overflow-hidden rounded-lg border dark:border-gray-700 h-40 w-full"
                              >
                                <Image
                                  src={formData.signatureUrl}
                                  alt="Signature"
                                  fill
                                  unoptimized
                                  className="object-contain bg-gray-50 dark:bg-gray-900/30 group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-200">
                                  View Full Image
                                </div>
                              </a>
                            ) : (
                              <div className="h-40 rounded-lg border border-dashed dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center text-gray-400">
                                <span className="text-xs">No Signature</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pb-2 border-b dark:border-gray-700">
                          Payment Information
                        </h3>
                        {paymentInfo ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  Payment Method
                                </label>
                                <p className="font-semibold text-gray-900 dark:text-gray-100 capitalize">
                                  {paymentInfo.method || '—'}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  Amount
                                </label>
                                <p className="font-semibold text-gray-950 dark:text-white">
                                  {paymentInfo.amount != null
                                    ? new Intl.NumberFormat('en-BD', {
                                        style: 'currency',
                                        currency: paymentInfo.currency || 'BDT',
                                        minimumFractionDigits: 0,
                                      }).format(paymentInfo.amount / 100)
                                    : '—'}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  Transaction ID
                                </label>
                                <p className="font-mono text-gray-900 dark:text-gray-100">
                                  {paymentInfo.transactionId || '—'}
                                </p>
                              </div>
                            </div>

                            {paymentInfo.proofUrl ? (
                              <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                                  Payment Proof Screenshot
                                </label>
                                <a
                                  href={paymentInfo.proofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block group relative overflow-hidden rounded-lg border dark:border-gray-700 h-48 w-full"
                                >
                                  <Image
                                    src={paymentInfo.proofUrl}
                                    alt="Payment Proof"
                                    fill
                                    unoptimized
                                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition-opacity duration-200">
                                    View Full Screenshot
                                  </div>
                                </a>
                              </div>
                            ) : (
                              <div className="h-48 rounded-lg border border-dashed dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col items-center justify-center text-gray-400">
                                <span className="text-xs">No payment proof uploaded</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 dark:text-gray-400 italic py-6 text-center">
                            No payment information associated with this record.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t dark:border-gray-700 flex justify-between items-center">
                  <div>
                    {isEditing ? (
                      <span className="text-xs text-orange-500 font-semibold animate-pulse">
                        * unsaved modifications
                      </span>
                    ) : null}
                  </div>
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            if (initialStudentInfo) {
                              setFormData({ ...initialStudentInfo });
                            }
                          }}
                          disabled={saving}
                          className="px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50 transition-colors shadow-sm shadow-blue-500/10"
                        >
                          {saving ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )}
                          Save Changes
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors shadow-sm"
                        >
                          <PencilIcon className="h-4 w-4" />
                          Edit Form
                        </button>
                        <button
                          onClick={onClose}
                          className="px-4 py-2 text-sm font-semibold text-white bg-gray-900 dark:bg-gray-100 dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-200 rounded-xl transition-colors shadow-sm"
                        >
                          Close
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
