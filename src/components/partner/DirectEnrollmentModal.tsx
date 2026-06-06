'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { FORM_SECTIONS, FORM_FIELDS } from '@/lib/pdf/form-fields';
import { toast } from 'sonner';

interface Member {
  id: string;
  memberNumber: string;
  fullNameEnglish: string | null;
  fullNameBangla: string | null;
  phoneNumber: string | null;
  email: string | null;
  sex: string | null;
  dateOfBirth: string | null;
  nid: string | null;
  bloodGroup: string | null;
  fatherName: string | null;
  motherName: string | null;
  occupation: string | null;
  institute: string | null;
  faculty: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  picture: string | null;
}

interface DirectEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: Member;
  onSuccess: () => void;
}

interface Course {
  id: string;
  name: string;
  admissionFee: number;
  monthlyFee: number;
  currency: string;
}

const visibleSections = FORM_SECTIONS.filter(
  (s) => s.id !== 'payment' && s.id !== 'review' && s.id !== 'images' && s.id !== 'branch'
);

export default function DirectEnrollmentModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: DirectEnrollmentModalProps) {
  // Steps: 1 = Select Course, 2 = Form Info, 3 = Payment Configuration, 4 = Review & Submit
  const [step, setStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  
  // Selection
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Form Details
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photoFile, setPhotoFile] = useState<string | null>(null);
  const [signatureFile, setSignatureFile] = useState<string | null>(null);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [transactionId, setTransactionId] = useState('');
  
  // Submission
  const [submitting, setSubmitting] = useState(false);

  // Fetch Courses belonging to the Partner
  useEffect(() => {
    if (isOpen) {
      setLoadingCourses(true);
      fetch('/api/partner-portal/courses')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to load courses');
          return res.json();
        })
        .then((data) => {
          setCourses(data || []);
        })
        .catch((err) => {
          console.error(err);
          toast.error('Could not fetch active courses');
        })
        .finally(() => {
          setLoadingCourses(false);
        });
    }
  }, [isOpen]);

  // Pre-fill form fields when member or selected course changes
  useEffect(() => {
    if (isOpen && member) {
      const formattedDob = member.dateOfBirth ? member.dateOfBirth.split('T')[0] || '' : '';
      const mapped: Record<string, string> = {
        name_en: member.fullNameEnglish || '',
        name_bn: member.fullNameBangla || '',
        dob: formattedDob,
        mobile: member.phoneNumber || '',
        email: member.email || '',
        nid: member.nid || '',
        blood_group: member.bloodGroup || '',
        father_name: member.fatherName || '',
        mother_name: member.motherName || '',
        occupation: member.occupation || 'Student',
        institution: member.institute || '',
        level_class: member.faculty || '',
        present_address: member.address || '',
        permanent_address: member.address || '',
        emergency_contact: member.emergencyPhone || member.phoneNumber || '',
        emergency_relation: 'Emergency Contact',
        nationality: 'Bangladeshi',
        religion: 'Islam',
        roll_id: 'N/A',
        father_occupation: 'Service',
        mother_occupation: 'Housewife',
        height: '5\'6"',
        weight: '60 kg',
        motive_first: 'To learn karate and self-defense.',
        signature_date: new Date().toISOString().split('T')[0],
      };

      // Calculate age
      if (formattedDob) {
        try {
          const birthYear = new Date(formattedDob).getFullYear();
          const currentYear = new Date().getFullYear();
          mapped.age = String(currentYear - birthYear);
        } catch {}
      }

      setFormData(mapped);
      setPhotoFile(member.picture || null);
      setSignatureFile(null);
      setStep(1);
      setSelectedCourseId('');
      setSelectedCourse(null);
      setPaymentMethod('cash');
      setTransactionId('');
    }
  }, [isOpen, member]);

  // Handle Course Choice
  const handleCourseChange = (courseId: string) => {
    setSelectedCourseId(courseId);
    const course = courses.find((c) => c.id === courseId) || null;
    setSelectedCourse(course);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleFileUpload = (type: 'photo' | 'signature') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'photo') {
        setPhotoFile(reader.result as string);
      } else {
        setSignatureFile(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency || 'BDT',
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const validateFormInfo = () => {
    const requiredFields = FORM_FIELDS.filter(
      (f) => f.required && f.section !== 'payment' && f.section !== 'review' && f.section !== 'images' && f.section !== 'branch'
    );
    for (const field of requiredFields) {
      if (!formData[field.id]?.trim()) {
        toast.error(`"${field.label}" is required.`);
        return false;
      }
    }
    return true;
  };

  // Submit direct enrollment
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // 1. Upload signature if base64 (photo can use member.picture as fallback if unchanged)
      let finalPhotoUrl = member.picture;
      let finalSignatureUrl = '';

      const uploadImage = async (dataUrl: string, type: 'photo' | 'signature') => {
        const res = await fetch('/api/enrollments/upload-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dataUrl, type, courseId: selectedCourseId }),
        });
        if (!res.ok) {
          throw new Error(`Failed to upload ${type}`);
        }
        const { secureUrl } = await res.json();
        return secureUrl as string;
      };

      if (photoFile && photoFile.startsWith('data:')) {
        finalPhotoUrl = await uploadImage(photoFile, 'photo');
      }
      if (signatureFile && signatureFile.startsWith('data:')) {
        finalSignatureUrl = await uploadImage(signatureFile, 'signature');
      }

      // Merge upload links into studentInfo
      const studentInfo = {
        ...formData,
        profilePhotoUrl: finalPhotoUrl,
        signatureUrl: finalSignatureUrl || undefined,
        hasPhoto: !!finalPhotoUrl,
        hasSignature: !!finalSignatureUrl,
      };

      // 2. Submit Enrollment POST
      const res = await fetch('/api/partner-portal/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          courseId: selectedCourseId,
          studentInfo,
          paymentMethod,
          transactionId: paymentMethod !== 'cash' && paymentMethod !== 'waived' ? transactionId.trim() : undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to complete enrollment');
      }

      toast.success('Member enrolled in course successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : 'Failed to enroll member');
    } finally {
      setSubmitting(false);
    }
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
                  <div className="flex items-center gap-2">
                    <AcademicCapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        Enroll Member to Course
                      </Dialog.Title>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Select a course and enter payment details to enroll{' '}
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {member.fullNameEnglish || 'this member'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg p-1"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Step Indicators */}
                <div className="flex justify-between border-b dark:border-gray-700 px-6 py-3 bg-gray-50/50 dark:bg-gray-900/10 text-xs font-semibold text-gray-500 dark:text-gray-400">
                  <span className={step === 1 ? 'text-blue-600 dark:text-blue-400' : ''}>1. Select Course</span>
                  <span className={step === 2 ? 'text-blue-600 dark:text-blue-400' : ''}>2. Confirm Member Details</span>
                  <span className={step === 3 ? 'text-blue-600 dark:text-blue-400' : ''}>3. Payment Configuration</span>
                  <span className={step === 4 ? 'text-blue-600 dark:text-blue-400' : ''}>4. Review & Submit</span>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/20 dark:bg-gray-900/5">
                  {/* Step 1: Select Course */}
                  {step === 1 && (
                    <div className="space-y-6">
                      {loadingCourses ? (
                        <div className="flex justify-center items-center py-12">
                          <span className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        </div>
                      ) : courses.length === 0 ? (
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-12">
                          No active courses are available for your venue. Please create a course first.
                        </p>
                      ) : (
                        <div className="max-w-xl mx-auto space-y-4">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Available Dojo Courses *
                          </label>
                          <select
                            value={selectedCourseId}
                            onChange={(e) => handleCourseChange(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            <option value="">-- Choose a course --</option>
                            {courses.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>

                          {selectedCourse && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 mt-6 space-y-3">
                              <h4 className="font-bold text-blue-900 dark:text-blue-400">{selectedCourse.name}</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Admission Fee:</span>{' '}
                                  <strong className="text-gray-900 dark:text-gray-100">
                                    {formatCurrency(selectedCourse.admissionFee, selectedCourse.currency)}
                                  </strong>
                                </div>
                                <div>
                                  <span className="text-gray-500 dark:text-gray-400">Monthly Fee:</span>{' '}
                                  <strong className="text-gray-900 dark:text-gray-100">
                                    {formatCurrency(selectedCourse.monthlyFee, selectedCourse.currency)}
                                  </strong>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Step 2: Form Details */}
                  {step === 2 && (
                    <div className="space-y-8">
                      {visibleSections.map((section) => (
                        <div
                          key={section.id}
                          className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4"
                        >
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
                                  {field.type === 'textarea' ? (
                                    <textarea
                                      value={value}
                                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                      className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                                      rows={2}
                                    />
                                  ) : field.type === 'select' ? (
                                    <select
                                      value={value}
                                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
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
                                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                      className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-white"
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}

                      {/* Image Upload box */}
                      <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 pb-2 border-b dark:border-gray-700">
                          Profile Picture & Signature
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {/* Profile photo */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Passport Photo</label>
                            {photoFile && (
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photoFile} alt="Profile Photo" className="w-full h-full object-cover" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload('photo')}
                              className="text-xs w-full text-gray-500 dark:text-gray-400"
                            />
                          </div>
                          {/* Signature photo */}
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Signature Image</label>
                            {signatureFile && (
                              <div className="relative w-32 h-16 rounded-lg overflow-hidden border bg-gray-50">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={signatureFile} alt="Signature" className="w-full h-full object-contain" />
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileUpload('signature')}
                              className="text-xs w-full text-gray-500 dark:text-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Payment */}
                  {step === 3 && selectedCourse && (
                    <div className="max-w-md mx-auto space-y-6">
                      <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700 space-y-2">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Enrollment Fees Due</h4>
                        <div className="flex justify-between text-sm">
                          <span>Admission Fee:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(selectedCourse.admissionFee, selectedCourse.currency)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>First Month Fee:</span>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(selectedCourse.monthlyFee, selectedCourse.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                            Payment Channel *
                          </label>
                          <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="mt-2 w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                          >
                            <option value="cash">Cash (Direct Hand-over)</option>
                            <option value="bkash">bKash</option>
                            <option value="nagad">Nagad</option>
                            <option value="rocket">Rocket</option>
                            <option value="waived">Waived (No Fee)</option>
                          </select>
                        </div>

                        {paymentMethod !== 'cash' && paymentMethod !== 'waived' && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                              Payment Transaction ID *
                            </label>
                            <input
                              type="text"
                              value={transactionId}
                              required
                              onChange={(e) => setTransactionId(e.target.value)}
                              placeholder="Enter Transaction ID"
                              className="mt-2 w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Review */}
                  {step === 4 && selectedCourse && (
                    <div className="max-w-md mx-auto space-y-6">
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl p-5 text-center space-y-2">
                        <CheckIcon className="h-8 w-8 text-green-600 mx-auto" />
                        <h4 className="font-bold text-green-950 dark:text-green-400">Ready to Enroll</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Confirming the following will active the course enrollment instantly.
                        </p>
                      </div>

                      <div className="divide-y dark:divide-gray-700 text-sm">
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500">Student:</span>
                          <span className="font-semibold">{formData.name_en}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500">Selected Course:</span>
                          <span className="font-semibold">{selectedCourse.name}</span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500">Admission Charge:</span>
                          <span className="font-semibold">
                            {formatCurrency(selectedCourse.admissionFee, selectedCourse.currency)}
                          </span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500">Monthly Tuition:</span>
                          <span className="font-semibold">
                            {formatCurrency(selectedCourse.monthlyFee, selectedCourse.currency)}
                          </span>
                        </div>
                        <div className="py-2.5 flex justify-between">
                          <span className="text-gray-500">Payment Channel:</span>
                          <span className="font-semibold uppercase">{paymentMethod}</span>
                        </div>
                        {paymentMethod !== 'cash' && paymentMethod !== 'waived' && (
                          <div className="py-2.5 flex justify-between">
                            <span className="text-gray-500">TxID:</span>
                            <span className="font-mono text-xs">{transactionId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-t dark:border-gray-700 flex items-center justify-between">
                  <button
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1 || submitting}
                    className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeftIcon className="h-4 w-4" /> Previous
                  </button>

                  <div className="flex items-center gap-2">
                    {step < 4 ? (
                      <button
                        onClick={() => {
                          if (step === 1 && !selectedCourseId) {
                            toast.error('Please select a course to continue.');
                            return;
                          }
                          if (step === 2 && !validateFormInfo()) {
                            return;
                          }
                          if (step === 3 && paymentMethod !== 'cash' && paymentMethod !== 'waived' && !transactionId.trim()) {
                            toast.error('Transaction ID is required.');
                            return;
                          }
                          setStep((s) => s + 1);
                        }}
                        className="inline-flex items-center gap-1 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
                      >
                        Next <ChevronRightIcon className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-lg shadow-md transition-colors disabled:opacity-50"
                      >
                        {submitting ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Enrolling...
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4" /> Complete Enrollment
                          </>
                        )}
                      </button>
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
