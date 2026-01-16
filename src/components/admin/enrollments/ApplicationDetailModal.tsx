'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
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
  pending_payment: { label: 'Pending Payment', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  payment_submitted: { label: 'Payment Submitted', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  payment_verified: { label: 'Payment Verified', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
  approved: { label: 'Approved', color: 'text-green-700', bgColor: 'bg-green-100' },
  rejected: { label: 'Rejected', color: 'text-red-700', bgColor: 'bg-red-100' },
  cancelled: { label: 'Cancelled', color: 'text-gray-700', bgColor: 'bg-gray-100' },
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
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-lg font-semibold text-gray-900">
                      Application #{app.applicationNumber}
                    </Dialog.Title>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.bgColor} ${status?.color}`}>
                      {status?.label || app.status}
                    </span>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="px-6 py-4 max-h-[70vh] overflow-y-auto space-y-6">
                  {/* Student Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2" />
                      Student Information
                    </h3>
                    <div className="flex items-start gap-4">
                      {app.studentInfo.profilePhotoUrl ? (
                        <img
                          src={app.studentInfo.profilePhotoUrl}
                          alt="Profile"
                          className="h-24 w-24 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-lg bg-gray-200 flex items-center justify-center">
                          <UserIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <label className="text-gray-500">Full Name (English)</label>
                          <p className="font-medium">{app.studentInfo.fullNameEnglish}</p>
                        </div>
                        {app.studentInfo.fullNameBangla && (
                          <div>
                            <label className="text-gray-500">Full Name (Bangla)</label>
                            <p className="font-medium">{app.studentInfo.fullNameBangla}</p>
                          </div>
                        )}
                        {app.studentInfo.fatherName && (
                          <div>
                            <label className="text-gray-500">Father&apos;s Name</label>
                            <p className="font-medium">{app.studentInfo.fatherName}</p>
                          </div>
                        )}
                        {app.studentInfo.motherName && (
                          <div>
                            <label className="text-gray-500">Mother&apos;s Name</label>
                            <p className="font-medium">{app.studentInfo.motherName}</p>
                          </div>
                        )}
                        {app.studentInfo.dateOfBirth && (
                          <div>
                            <label className="text-gray-500">Date of Birth</label>
                            <p className="font-medium">{app.studentInfo.dateOfBirth}</p>
                          </div>
                        )}
                        {app.studentInfo.gender && (
                          <div>
                            <label className="text-gray-500">Gender</label>
                            <p className="font-medium capitalize">{app.studentInfo.gender}</p>
                          </div>
                        )}
                        {app.studentInfo.bloodGroup && (
                          <div>
                            <label className="text-gray-500">Blood Group</label>
                            <p className="font-medium">{app.studentInfo.bloodGroup}</p>
                          </div>
                        )}
                        {app.studentInfo.nationalIdNumber && (
                          <div>
                            <label className="text-gray-500">NID Number</label>
                            <p className="font-medium">{app.studentInfo.nationalIdNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        <span>{app.studentInfo.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        <span>{app.studentInfo.phoneNumber}</span>
                      </div>
                      {app.studentInfo.emergencyContact && (
                        <div className="flex items-center gap-2">
                          <PhoneIcon className="h-4 w-4 text-red-400" />
                          <span>Emergency: {app.studentInfo.emergencyContact}</span>
                        </div>
                      )}
                      {app.studentInfo.address && (
                        <div className="col-span-2 flex items-start gap-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400 mt-1" />
                          <span>{app.studentInfo.address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Course & Payment Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <IdentificationIcon className="h-5 w-5 mr-2" />
                        Course Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <label className="text-gray-500">Course</label>
                          <p className="font-medium">{course?.name || 'Unknown'}</p>
                        </div>
                        <div>
                          <label className="text-gray-500">Admission Fee</label>
                          <p className="font-medium">{formatCurrency(app.admissionFeeAmount, app.currency)}</p>
                        </div>
                        {course && (
                          <div>
                            <label className="text-gray-500">Monthly Fee</label>
                            <p className="font-medium">{formatCurrency(course.monthlyFee, app.currency)}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <BanknotesIcon className="h-5 w-5 mr-2" />
                        Payment Details
                      </h3>
                      <div className="space-y-2 text-sm">
                        <div>
                          <label className="text-gray-500">Payment Method</label>
                          <p className="font-medium">{app.paymentMethod || 'Not submitted'}</p>
                        </div>
                        {app.transactionId && (
                          <div>
                            <label className="text-gray-500">Transaction ID</label>
                            <p className="font-medium font-mono">{app.transactionId}</p>
                          </div>
                        )}
                        {app.paymentSubmittedAt && (
                          <div>
                            <label className="text-gray-500">Payment Submitted</label>
                            <p className="font-medium">{formatDateTime(app.paymentSubmittedAt)}</p>
                          </div>
                        )}
                        {app.paymentVerifiedAt && (
                          <div>
                            <label className="text-gray-500">Payment Verified</label>
                            <p className="font-medium">{formatDateTime(app.paymentVerifiedAt)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Proof */}
                  {app.paymentProofUrl && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                        <DocumentCheckIcon className="h-5 w-5 mr-2" />
                        Payment Proof
                      </h3>
                      <a
                        href={app.paymentProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block max-w-md"
                      >
                        <img
                          src={app.paymentProofUrl}
                          alt="Payment Proof"
                          className="rounded-lg border shadow-sm max-h-64 object-contain"
                        />
                      </a>
                      <p className="text-xs text-gray-500 mt-2">Click to view full image</p>
                    </div>
                  )}

                  {/* Additional Info */}
                  {(app.studentInfo.previousMartialArtsExperience || app.studentInfo.medicalConditions) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-gray-900 mb-4">Additional Information</h3>
                      <div className="space-y-3 text-sm">
                        {app.studentInfo.previousMartialArtsExperience && (
                          <div>
                            <label className="text-gray-500">Previous Martial Arts Experience</label>
                            <p className="font-medium">{app.studentInfo.previousMartialArtsExperience}</p>
                          </div>
                        )}
                        {app.studentInfo.medicalConditions && (
                          <div>
                            <label className="text-gray-500">Medical Conditions</label>
                            <p className="font-medium text-orange-600">{app.studentInfo.medicalConditions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      Timeline
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="h-4 w-4 text-gray-400" />
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
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h3 className="text-sm font-semibold text-red-700 mb-2">Rejection Reason</h3>
                      <p className="text-sm text-red-600">{app.rejectionReason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg"
                  >
                    Close
                  </button>

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
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
