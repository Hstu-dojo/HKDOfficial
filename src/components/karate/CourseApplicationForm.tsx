'use client';

import { useState } from 'react';
import { useSession } from '@/hooks/useSessionCompat';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  IdentificationIcon,
  CalendarIcon,
  HeartIcon,
  AcademicCapIcon,
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface Course {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  monthlyFee: number;
  admissionFee: number;
  currency: string;
  bkashNumber?: string;
  bkashQrCodeUrl?: string;
  nagadNumber?: string;
  rocketNumber?: string;
  imageUrl?: string;
}

interface StudentInfo {
  fullNameEnglish: string;
  fullNameBangla: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  email: string;
  phoneNumber: string;
  emergencyContact: string;
  address: string;
  occupation: string;
  institution: string;
  previousMartialArtsExperience: string;
  medicalConditions: string;
  nationalIdNumber: string;
  profilePhotoUrl: string;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['male', 'female', 'other'];

const steps = [
  { id: 'personal', name: 'Personal Info', icon: UserIcon },
  { id: 'contact', name: 'Contact Info', icon: PhoneIcon },
  { id: 'background', name: 'Background', icon: AcademicCapIcon },
  { id: 'payment', name: 'Payment', icon: CurrencyDollarIcon },
  { id: 'review', name: 'Review', icon: DocumentTextIcon },
];

export default function CourseApplicationForm({ course }: { course: Course }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    fullNameEnglish: '',
    fullNameBangla: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    email: session?.user?.email || '',
    phoneNumber: '',
    emergencyContact: '',
    address: '',
    occupation: '',
    institution: '',
    previousMartialArtsExperience: '',
    medicalConditions: '',
    nationalIdNumber: '',
    profilePhotoUrl: '',
  });
  
  const [paymentInfo, setPaymentInfo] = useState({
    paymentMethod: 'bkash',
    transactionId: '',
    paymentProofUrl: '',
  });

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const updateStudentInfo = (field: keyof StudentInfo, value: string) => {
    setStudentInfo((prev) => ({ ...prev, [field]: value }));
  };

  const updatePaymentInfo = (field: string, value: string) => {
    setPaymentInfo((prev) => ({ ...prev, [field]: value }));
  };

  // Validation per step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0: // Personal Info
        if (!studentInfo.fullNameEnglish || !studentInfo.dateOfBirth || !studentInfo.gender) {
          toast.error('Please fill in all required fields');
          return false;
        }
        return true;
      case 1: // Contact Info
        if (!studentInfo.email || !studentInfo.phoneNumber || !studentInfo.address) {
          toast.error('Please fill in all required fields');
          return false;
        }
        return true;
      case 2: // Background - optional
        return true;
      case 3: // Payment
        if (!paymentInfo.transactionId) {
          toast.error('Please enter the transaction ID');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmitApplication = async () => {
    if (status !== 'authenticated') {
      toast.error('Please log in to submit your application');
      router.push('/auth/signin');
      return;
    }

    setSubmitting(true);
    
    try {
      // Step 1: Create the application
      const createResponse = await fetch('/api/enrollments/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          studentInfo,
        }),
      });

      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.error || 'Failed to create application');
      }

      const { applicationId: newApplicationId } = await createResponse.json();
      setApplicationId(newApplicationId);

      // Step 2: Submit payment proof
      const paymentResponse = await fetch(`/api/enrollments/${newApplicationId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentInfo),
      });

      if (!paymentResponse.ok) {
        const error = await paymentResponse.json();
        throw new Error(error.error || 'Failed to submit payment');
      }

      toast.success('Application submitted successfully!');
      router.push(`/karate/courses/${course.slug}/apply/success?applicationId=${newApplicationId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <UserIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">
            Please log in to apply for the {course.name} course.
          </p>
          <Link
            href={`/auth/signin?callbackUrl=/karate/courses/${course.slug}/apply`}
            className="inline-block px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700"
          >
            Sign In to Continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/karate/courses`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Apply for {course.name}</h1>
          <p className="text-gray-600 mt-2">{course.shortDescription}</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <li key={step.id} className={`relative ${index !== steps.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}>
                    <div className="flex items-center">
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          index < currentStep
                            ? 'bg-red-600 text-white'
                            : index === currentStep
                            ? 'bg-red-600 text-white ring-4 ring-red-100'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {index < currentStep ? (
                          <CheckCircleIcon className="h-5 w-5" />
                        ) : (
                          <StepIcon className="h-5 w-5" />
                        )}
                      </div>
                      {index !== steps.length - 1 && (
                        <div
                          className={`hidden sm:block w-full h-0.5 ${
                            index < currentStep ? 'bg-red-600' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                    <span className="text-xs mt-2 block text-gray-500">{step.name}</span>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Step 0: Personal Info */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <UserIcon className="h-6 w-6 mr-2 text-red-600" />
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (English) *
                  </label>
                  <input
                    type="text"
                    value={studentInfo.fullNameEnglish}
                    onChange={(e) => updateStudentInfo('fullNameEnglish', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name (Bangla)
                  </label>
                  <input
                    type="text"
                    value={studentInfo.fullNameBangla}
                    onChange={(e) => updateStudentInfo('fullNameBangla', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="জন ডো"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={studentInfo.fatherName}
                    onChange={(e) => updateStudentInfo('fatherName', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mother&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={studentInfo.motherName}
                    onChange={(e) => updateStudentInfo('motherName', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date of Birth *
                  </label>
                  <input
                    type="date"
                    value={studentInfo.dateOfBirth}
                    onChange={(e) => updateStudentInfo('dateOfBirth', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gender *
                  </label>
                  <select
                    value={studentInfo.gender}
                    onChange={(e) => updateStudentInfo('gender', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  >
                    <option value="">Select gender</option>
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blood Group
                  </label>
                  <select
                    value={studentInfo.bloodGroup}
                    onChange={(e) => updateStudentInfo('bloodGroup', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NID / Birth Certificate Number
                  </label>
                  <input
                    type="text"
                    value={studentInfo.nationalIdNumber}
                    onChange={(e) => updateStudentInfo('nationalIdNumber', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Photo URL
                </label>
                <input
                  type="url"
                  value={studentInfo.profilePhotoUrl}
                  onChange={(e) => updateStudentInfo('profilePhotoUrl', e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="https://example.com/photo.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">Upload your photo to any image hosting service and paste the URL here</p>
              </div>
            </div>
          )}

          {/* Step 1: Contact Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <PhoneIcon className="h-6 w-6 mr-2 text-red-600" />
                Contact Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={studentInfo.email}
                    onChange={(e) => updateStudentInfo('email', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={studentInfo.phoneNumber}
                    onChange={(e) => updateStudentInfo('phoneNumber', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="01XXXXXXXXX"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Emergency Contact
                  </label>
                  <input
                    type="tel"
                    value={studentInfo.emergencyContact}
                    onChange={(e) => updateStudentInfo('emergencyContact', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="01XXXXXXXXX"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <textarea
                  value={studentInfo.address}
                  onChange={(e) => updateStudentInfo('address', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="House, Road, Area, City"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Background */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <AcademicCapIcon className="h-6 w-6 mr-2 text-red-600" />
                Background Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Occupation
                  </label>
                  <input
                    type="text"
                    value={studentInfo.occupation}
                    onChange={(e) => updateStudentInfo('occupation', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="Student, Engineer, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School/College/University
                  </label>
                  <input
                    type="text"
                    value={studentInfo.institution}
                    onChange={(e) => updateStudentInfo('institution', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Previous Martial Arts Experience
                </label>
                <textarea
                  value={studentInfo.previousMartialArtsExperience}
                  onChange={(e) => updateStudentInfo('previousMartialArtsExperience', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Describe any previous martial arts training, if any"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions / Allergies
                </label>
                <textarea
                  value={studentInfo.medicalConditions}
                  onChange={(e) => updateStudentInfo('medicalConditions', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="List any medical conditions or allergies we should be aware of"
                />
                <p className="text-xs text-gray-500 mt-1">This information will be kept confidential and used only for safety purposes</p>
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <CurrencyDollarIcon className="h-6 w-6 mr-2 text-red-600" />
                Payment Information
              </h2>
              
              <div className="bg-red-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Admission Fee to Pay</h3>
                <p className="text-3xl font-bold text-red-600">
                  {formatCurrency(course.admissionFee, course.currency)}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Monthly fee: {formatCurrency(course.monthlyFee, course.currency)} (to be paid after approval)
                </p>
              </div>
              
              {/* Payment Methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Payment Method *
                </label>
                <div className="grid grid-cols-3 gap-4">
                  {course.bkashNumber && (
                    <button
                      type="button"
                      onClick={() => updatePaymentInfo('paymentMethod', 'bkash')}
                      className={`p-4 border-2 rounded-lg text-center ${
                        paymentInfo.paymentMethod === 'bkash'
                          ? 'border-pink-500 bg-pink-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">🔴</div>
                      <div className="font-medium">bKash</div>
                    </button>
                  )}
                  {course.nagadNumber && (
                    <button
                      type="button"
                      onClick={() => updatePaymentInfo('paymentMethod', 'nagad')}
                      className={`p-4 border-2 rounded-lg text-center ${
                        paymentInfo.paymentMethod === 'nagad'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">🟠</div>
                      <div className="font-medium">Nagad</div>
                    </button>
                  )}
                  {course.rocketNumber && (
                    <button
                      type="button"
                      onClick={() => updatePaymentInfo('paymentMethod', 'rocket')}
                      className={`p-4 border-2 rounded-lg text-center ${
                        paymentInfo.paymentMethod === 'rocket'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">🟣</div>
                      <div className="font-medium">Rocket</div>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Payment Instructions */}
              {paymentInfo.paymentMethod === 'bkash' && course.bkashNumber && (
                <div className="bg-pink-50 rounded-lg p-6">
                  <h4 className="font-semibold text-pink-900 mb-3">bKash Payment Instructions</h4>
                  <ol className="list-decimal list-inside text-sm text-pink-800 space-y-2">
                    <li>Open bKash App</li>
                    <li>Go to &quot;Send Money&quot;</li>
                    <li>Enter number: <span className="font-mono font-bold">{course.bkashNumber}</span></li>
                    <li>Enter amount: {formatCurrency(course.admissionFee, course.currency)}</li>
                    <li>Add reference: Your Full Name</li>
                    <li>Complete the payment</li>
                    <li>Note down the Transaction ID</li>
                  </ol>
                  
                  {course.bkashQrCodeUrl && (
                    <div className="mt-4">
                      <p className="text-sm text-pink-800 mb-2">Or scan this QR code:</p>
                      <div className="bg-white p-4 rounded-lg inline-block">
                        <Image
                          src={course.bkashQrCodeUrl}
                          alt="bKash QR Code"
                          width={200}
                          height={200}
                          className="rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Transaction Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID *
                  </label>
                  <input
                    type="text"
                    value={paymentInfo.transactionId}
                    onChange={(e) => updatePaymentInfo('transactionId', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                    placeholder="e.g., TXN123456789"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Screenshot URL
                  </label>
                  <input
                    type="url"
                    value={paymentInfo.paymentProofUrl}
                    onChange={(e) => updatePaymentInfo('paymentProofUrl', e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="https://example.com/screenshot.jpg"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload screenshot to imgur.com and paste the link</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <DocumentTextIcon className="h-6 w-6 mr-2 text-red-600" />
                Review Your Application
              </h2>
              
              <div className="space-y-4">
                {/* Personal Info Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Personal Information</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Name:</dt>
                    <dd className="font-medium">{studentInfo.fullNameEnglish}</dd>
                    {studentInfo.fullNameBangla && (
                      <>
                        <dt className="text-gray-500">Name (Bangla):</dt>
                        <dd className="font-medium">{studentInfo.fullNameBangla}</dd>
                      </>
                    )}
                    <dt className="text-gray-500">Date of Birth:</dt>
                    <dd className="font-medium">{studentInfo.dateOfBirth}</dd>
                    <dt className="text-gray-500">Gender:</dt>
                    <dd className="font-medium capitalize">{studentInfo.gender}</dd>
                    {studentInfo.bloodGroup && (
                      <>
                        <dt className="text-gray-500">Blood Group:</dt>
                        <dd className="font-medium">{studentInfo.bloodGroup}</dd>
                      </>
                    )}
                  </dl>
                </div>
                
                {/* Contact Info Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Contact Information</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Email:</dt>
                    <dd className="font-medium">{studentInfo.email}</dd>
                    <dt className="text-gray-500">Phone:</dt>
                    <dd className="font-medium">{studentInfo.phoneNumber}</dd>
                    <dt className="text-gray-500">Address:</dt>
                    <dd className="font-medium col-span-2">{studentInfo.address}</dd>
                  </dl>
                </div>
                
                {/* Course & Payment Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Course & Payment</h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <dt className="text-gray-500">Course:</dt>
                    <dd className="font-medium">{course.name}</dd>
                    <dt className="text-gray-500">Admission Fee:</dt>
                    <dd className="font-medium text-red-600">{formatCurrency(course.admissionFee, course.currency)}</dd>
                    <dt className="text-gray-500">Payment Method:</dt>
                    <dd className="font-medium capitalize">{paymentInfo.paymentMethod}</dd>
                    <dt className="text-gray-500">Transaction ID:</dt>
                    <dd className="font-medium font-mono">{paymentInfo.transactionId}</dd>
                  </dl>
                </div>
              </div>
              
              {/* Disclaimer */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  By submitting this application, I confirm that all information provided is accurate. 
                  I understand that the admission fee is non-refundable and my enrollment is subject 
                  to admin approval after payment verification.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-6 py-2 rounded-lg ${
                currentStep === 0
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Previous
            </button>
            
            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmitApplication}
                disabled={submitting}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
