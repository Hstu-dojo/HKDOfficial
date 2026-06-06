'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import Image from 'next/image';
import {
  XMarkIcon,
  UserIcon,
  DocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BanknotesIcon,
  CalendarIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  PrinterIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

interface Application {
  application: {
    id: string;
    applicationNumber: string;
    userId: string;
    courseId: string;
    studentInfo: {
      fullNameEnglish: string;
      fullNameBangla?: string;
      fatherName?: string;
      motherName?: string;
      dateOfBirth?: string;
      gender?: string;
      bloodGroup?: string;
      email: string;
      phoneNumber: string;
      emergencyContact?: string;
      address?: string;
      occupation?: string;
      institution?: string;
      previousMartialArtsExperience?: string;
      medicalConditions?: string;
      profilePhotoUrl?: string;
      nationalIdNumber?: string;
    };
    admissionFeeAmount: number;
    currency: string;
    status: string;
    paymentMethod?: string;
    transactionId?: string;
    paymentProofUrl?: string;
    paymentSubmittedAt?: string;
    paymentVerifiedAt?: string;
    verifiedById?: string;
    reviewedAt?: string;
    reviewedById?: string;
    rejectionReason?: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
  };
  course: {
    id: string;
    name: string;
    monthlyFee: number;
    admissionFee: number;
  } | null;
  applicant: {
    id: string;
    email: string;
    userName: string;
  } | null;
}

interface Props {
  application: Application;
  onClose: () => void;
  onAction: (id: string, action: string, data?: Record<string, string>) => Promise<void>;
  canVerify: boolean;
  canApprove: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  pending_payment: { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  payment_submitted: { label: 'Payment Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  payment_verified: { label: 'Payment Verified', color: 'text-indigo-700', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  approved: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  cancelled: { label: 'Cancelled', color: 'text-gray-700 dark:text-gray-300', bgColor: 'bg-gray-100 dark:bg-gray-700' },
};

export default function ApplicationDetailModal({
  application,
  onClose,
  onAction,
  canVerify,
  canApprove,
}: Props) {
  const { application: app, course, applicant } = application;
  const status = STATUS_CONFIG[app.status];
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState(app.studentInfo);
  const [isSaving, setIsSaving] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleReject = () => {
    const reason = prompt('Enter rejection reason:');
    if (reason) {
      onAction(app.id, 'reject', { rejectionReason: reason });
    }
  };

  const handleSaveInfo = async () => {
    setIsSaving(true);
    try {
      await onAction(app.id, 'update_info', { studentInfo: JSON.stringify(editedInfo) });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const html = `
      <html>
        <head>
          <title>Application #${app.applicationNumber}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; line-height: 1.5; color: #333; }
            h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            h2 { font-size: 18px; margin-top: 30px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
            .full-width { grid-column: 1 / -1; }
            .label { font-weight: bold; color: #666; font-size: 11px; text-transform: uppercase; margin-bottom: 2px; }
            .value { font-size: 14px; }
            img { max-width: 150px; border-radius: 8px; border: 1px solid #ddd; }
          </style>
        </head>
        <body>
          <h1>Application #${app.applicationNumber}</h1>
          <div class="grid">
            <div><div class="label">Status</div><div class="value">${app.status.replace('_', ' ').toUpperCase()}</div></div>
            <div><div class="label">Applied On</div><div class="value">${formatDateTime(app.createdAt)}</div></div>
          </div>
          
          <h2>Student Information</h2>
          <div class="grid">
            ${app.studentInfo.profilePhotoUrl ? `<div class="full-width"><img src="${app.studentInfo.profilePhotoUrl}" /></div>` : ''}
            <div><div class="label">Full Name (English)</div><div class="value">${app.studentInfo.fullNameEnglish}</div></div>
            <div><div class="label">Full Name (Bangla)</div><div class="value">${app.studentInfo.fullNameBangla || 'N/A'}</div></div>
            <div><div class="label">Father's Name</div><div class="value">${app.studentInfo.fatherName || 'N/A'}</div></div>
            <div><div class="label">Mother's Name</div><div class="value">${app.studentInfo.motherName || 'N/A'}</div></div>
            <div><div class="label">Date of Birth</div><div class="value">${app.studentInfo.dateOfBirth || 'N/A'}</div></div>
            <div><div class="label">Gender</div><div class="value">${app.studentInfo.gender || 'N/A'}</div></div>
            <div><div class="label">Blood Group</div><div class="value">${app.studentInfo.bloodGroup || 'N/A'}</div></div>
            <div><div class="label">NID/Birth Cert</div><div class="value">${app.studentInfo.nationalIdNumber || 'N/A'}</div></div>
          </div>

          <h2>Contact Information</h2>
          <div class="grid">
            <div><div class="label">Email</div><div class="value">${app.studentInfo.email}</div></div>
            <div><div class="label">Phone Number</div><div class="value">${app.studentInfo.phoneNumber}</div></div>
            <div><div class="label">Emergency Contact</div><div class="value">${app.studentInfo.emergencyContact || 'N/A'}</div></div>
            <div class="full-width"><div class="label">Address</div><div class="value">${app.studentInfo.address || 'N/A'}</div></div>
          </div>

          <h2>Course Details</h2>
          <div class="grid">
            <div><div class="label">Course</div><div class="value">${course?.name || 'Unknown'}</div></div>
            <div><div class="label">Admission Fee</div><div class="value">${app.admissionFeeAmount} ${app.currency}</div></div>
          </div>
          
          <script>
            window.onload = function() { 
              setTimeout(function() { window.print(); window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleInfoChange = (field: keyof typeof editedInfo, value: string) => {
    setEditedInfo((prev: any) => ({ ...prev, [field]: value }));
  };

  return (
    <Transition appear show={true} as={Fragment}>
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
          <div className="fixed inset-0 bg-black/30" />
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
              <Dialog.Panel className="w-full max-w-3xl max-h-[calc(100dvh-2rem)] transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all flex flex-col">
                {/* Header */}
                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-b flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                      Application #{app.applicationNumber}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.bgColor} ${status?.color}`}>
                        {status?.label || app.status}
                      </span>
                    </Dialog.Title>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrint}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      title="Download as PDF"
                    >
                      <PrinterIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={onClose}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                <div className="px-6 py-4 flex-1 overflow-y-auto space-y-6">
                  {/* Student Info */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center">
                        <UserIcon className="h-5 w-5 mr-2" />
                        Student Information
                      </h3>
                      {!isEditing && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 flex items-center gap-1"
                        >
                          <PencilIcon className="h-4 w-4" /> Edit
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-start gap-4">
                      {app.studentInfo.profilePhotoUrl ? (
                        <Image
                          src={app.studentInfo.profilePhotoUrl}
                          alt="Profile"
                          width={96}
                          height={96}
                          unoptimized
                          className="h-24 w-24 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                          <UserIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-gray-500 dark:text-gray-400 text-xs">Full Name (English)</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={editedInfo.fullNameEnglish || ''} 
                              onChange={(e) => handleInfoChange('fullNameEnglish', e.target.value)} 
                            />
                          ) : (
                            <p className="font-medium">{app.studentInfo.fullNameEnglish}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-500 dark:text-gray-400 text-xs">Full Name (Bangla)</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={editedInfo.fullNameBangla || ''} 
                              onChange={(e) => handleInfoChange('fullNameBangla', e.target.value)} 
                            />
                          ) : (
                            <p className="font-medium">{app.studentInfo.fullNameBangla || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-500 dark:text-gray-400 text-xs">Father&apos;s Name</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={editedInfo.fatherName || ''} 
                              onChange={(e) => handleInfoChange('fatherName', e.target.value)} 
                            />
                          ) : (
                            <p className="font-medium">{app.studentInfo.fatherName || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-500 dark:text-gray-400 text-xs">Mother&apos;s Name</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={editedInfo.motherName || ''} 
                              onChange={(e) => handleInfoChange('motherName', e.target.value)} 
                            />
                          ) : (
                            <p className="font-medium">{app.studentInfo.motherName || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-500 dark:text-gray-400 text-xs">Date of Birth</label>
                          {isEditing ? (
                            <input 
                              type="date" 
                              className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={editedInfo.dateOfBirth || ''} 
                              onChange={(e) => handleInfoChange('dateOfBirth', e.target.value)} 
                            />
                          ) : (
                            <p className="font-medium">{app.studentInfo.dateOfBirth || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-500 dark:text-gray-400 text-xs">Gender</label>
                          {isEditing ? (
                            <select 
                              className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={editedInfo.gender || ''} 
                              onChange={(e) => handleInfoChange('gender', e.target.value)}
                            >
                              <option value="">Select...</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                          ) : (
                            <p className="font-medium capitalize">{app.studentInfo.gender || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-500 dark:text-gray-400 text-xs">Blood Group</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={editedInfo.bloodGroup || ''} 
                              onChange={(e) => handleInfoChange('bloodGroup', e.target.value)} 
                            />
                          ) : (
                            <p className="font-medium">{app.studentInfo.bloodGroup || '—'}</p>
                          )}
                        </div>
                        <div>
                          <label className="text-gray-500 dark:text-gray-400 text-xs">NID Number</label>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={editedInfo.nationalIdNumber || ''} 
                              onChange={(e) => handleInfoChange('nationalIdNumber', e.target.value)} 
                            />
                          ) : (
                            <p className="font-medium">{app.studentInfo.nationalIdNumber || '—'}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><EnvelopeIcon className="h-3 w-3" /> Email</label>
                        {isEditing ? (
                          <input 
                            type="email" 
                            className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={editedInfo.email || ''} 
                            onChange={(e) => handleInfoChange('email', e.target.value)} 
                          />
                        ) : (
                          <p className="font-medium">{app.studentInfo.email}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><PhoneIcon className="h-3 w-3" /> Phone</label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={editedInfo.phoneNumber || ''} 
                            onChange={(e) => handleInfoChange('phoneNumber', e.target.value)} 
                          />
                        ) : (
                          <p className="font-medium">{app.studentInfo.phoneNumber}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><PhoneIcon className="h-3 w-3 text-red-400" /> Emergency Contact</label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={editedInfo.emergencyContact || ''} 
                            onChange={(e) => handleInfoChange('emergencyContact', e.target.value)} 
                          />
                        ) : (
                          <p className="font-medium">{app.studentInfo.emergencyContact || '—'}</p>
                        )}
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1"><MapPinIcon className="h-3 w-3" /> Address</label>
                        {isEditing ? (
                          <input 
                            type="text" 
                            className="w-full mt-1 px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={editedInfo.address || ''} 
                            onChange={(e) => handleInfoChange('address', e.target.value)} 
                          />
                        ) : (
                          <p className="font-medium">{app.studentInfo.address || '—'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Course & Payment Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <IdentificationIcon className="h-5 w-5 mr-2" />
                        Course Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <label className="text-gray-500 dark:text-gray-400">Course</label>
                          <p className="font-medium">{course?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <label className="text-gray-500 dark:text-gray-400">Admission Fee</label>
                          <p className="font-medium">{formatCurrency(app.admissionFeeAmount, app.currency)}</p>
                        </div>
                        {course && (
                          <div>
                            <label className="text-gray-500 dark:text-gray-400">Monthly Fee</label>
                            <p className="font-medium">{formatCurrency(course.monthlyFee, app.currency)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <BanknotesIcon className="h-5 w-5 mr-2" />
                        Payment Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <label className="text-gray-500 dark:text-gray-400">Payment Method</label>
                          <p className="font-medium">{app.paymentMethod || 'Not submitted'}</p>
                        </div>
                        {app.transactionId && (
                          <div>
                            <label className="text-gray-500 dark:text-gray-400">Transaction ID</label>
                            <p className="font-medium font-mono">{app.transactionId}</p>
                          </div>
                        )}
                        {app.paymentSubmittedAt && (
                          <div>
                            <label className="text-gray-500 dark:text-gray-400">Payment Submitted</label>
                            <p className="font-medium">{formatDateTime(app.paymentSubmittedAt)}</p>
                          </div>
                        )}
                        {app.paymentVerifiedAt && (
                          <div>
                            <label className="text-gray-500 dark:text-gray-400">Payment Verified</label>
                            <p className="font-medium">{formatDateTime(app.paymentVerifiedAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Proof */}
                  {app.paymentProofUrl && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                        <DocumentCheckIcon className="h-5 w-5 mr-2" />
                        Payment Proof
                      </h3>
                      <a
                        href={app.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block max-w-md"
                      >
                        <Image
                          src={app.paymentProofUrl}
                          alt="Payment Proof"
                          width={800}
                          height={600}
                          unoptimized
                          className="rounded-lg border shadow-sm max-h-64 w-full object-contain"
                        />
                      </a>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Click to view full image</p>
                    </div>
                  )}

                  {/* Additional Info */}
                  {(app.studentInfo.previousMartialArtsExperience || app.studentInfo.medicalConditions) && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Information</h3>
                      <div className="space-y-3 text-sm">
                        {app.studentInfo.previousMartialArtsExperience && (
                          <div>
                            <label className="text-gray-500 dark:text-gray-400">Previous Martial Arts Experience</label>
                            <p className="font-medium">{app.studentInfo.previousMartialArtsExperience}</p>
                          </div>
                        )}
                        {app.studentInfo.medicalConditions && (
                          <div>
                            <label className="text-gray-500 dark:text-gray-400">Medical Conditions</label>
                            <p className="font-medium text-orange-600">{app.studentInfo.medicalConditions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      Timeline
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <span>Applied: {formatDateTime(app.createdAt)}</span>
                      </div>
                      {app.paymentSubmittedAt && (
                        <div className="flex items-center gap-3">
                          <BanknotesIcon className="h-4 w-4 text-blue-500" />
                          <span>Payment Submitted: {formatDateTime(app.paymentSubmittedAt)}</span>
                        </div>
                      )}
                      {app.paymentVerifiedAt && (
                        <div className="flex items-center gap-3">
                          <DocumentCheckIcon className="h-4 w-4 text-indigo-500" />
                          <span>Payment Verified: {formatDateTime(app.paymentVerifiedAt)}</span>
                        </div>
                      )}
                      {app.reviewedAt && (
                        <div className="flex items-center gap-3">
                          {app.status === 'approved' ? (
                            <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-red-500" />
                          )}
                          <span>
                            {app.status === 'approved' ? 'Approved' : 'Rejected'}: {formatDateTime(app.reviewedAt)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {app.rejectionReason && (
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <h3 className="text-sm font-semibold text-red-700 mb-2">Rejection Reason</h3>
                      <p className="text-sm text-red-600 dark:text-red-400">{app.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-4 border-t flex justify-between items-center gap-3">
                  <div>
                    {isEditing && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditedInfo(app.studentInfo);
                            setIsEditing(false);
                          }}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveInfo}
                          disabled={isSaving}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg"
                        >
                          {isSaving ? 'Saving...' : 'Save Info'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 items-center">
                    {!isEditing && (
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg"
                      >
                        Close
                      </button>
                    )}

                    {app.status === 'payment_submitted' && canVerify && (
                      <button
                        onClick={() => onAction(app.id, 'verify_payment')}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                      >
                        <DocumentCheckIcon className="h-4 w-4" />
                        Verify Payment
                      </button>
                    )}

                    {app.status === 'payment_verified' && canApprove && (
                      <>
                        <button
                          onClick={handleReject}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
                        >
                          <XCircleIcon className="h-4 w-4" />
                          Reject
                        </button>
                        <button
                          onClick={() => onAction(app.id, 'approve')}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Approve
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
