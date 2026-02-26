'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Phone,
  GraduationCap,
  Users,
  Activity,
  Target,
  MapPin,
  Camera,
  CreditCard,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  FileDown,
  RotateCcw,
  AlertCircle,
  Info,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ImageUpload from './ImageUpload';
import {
  FORM_SECTIONS,
  FORM_FIELDS,
  getFieldsBySection,
  getSectionCompletion,
  validateSection,
  validateAllSections,
  mapOnboardingToFormData,
  mapFormDataToOnboarding,
  type FormFieldDef,
} from '@/lib/pdf/form-fields';
import {
  fillPdfForm,
  downloadPdf,
  downloadBlankForm,
  saveFormToLocalStorage,
  loadFormFromLocalStorage,
  clearFormLocalStorage,
  type FormData as PdfFormData,
  type ImageData,
} from '@/lib/pdf/pdf-utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface CourseEnrollmentWizardProps {
  course: Course;
  onboardingData: Record<string, unknown> | null;
  partnerName: string;
  partnerLocation: string;
  existingPartnerId: string | null;
  userEmail: string;
}

// ---------------------------------------------------------------------------
// Section icon map
// ---------------------------------------------------------------------------

const SECTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  basic: User,
  contact: Phone,
  student: GraduationCap,
  family: Users,
  physical: Activity,
  activities: Target,
  branch: MapPin,
  images: Camera,
  payment: CreditCard,
  review: CheckCircle,
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CourseEnrollmentWizard({
  course,
  onboardingData,
  partnerName,
  partnerLocation,
  existingPartnerId,
  userEmail,
}: CourseEnrollmentWizardProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Form state
  const [formData, setFormData] = useState<PdfFormData>({});
  const [images, setImages] = useState<ImageData>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [direction, setDirection] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');

  // Initialise form data from onboarding or localStorage
  useEffect(() => {
    const saved = loadFormFromLocalStorage(course.id);
    let initial: PdfFormData = {};

    // Start with defaults
    for (const field of FORM_FIELDS) {
      if (field.defaultValue !== undefined) {
        initial[field.id] = field.defaultValue;
      }
    }

    // Overlay onboarding data
    if (onboardingData) {
      const mapped = mapOnboardingToFormData(onboardingData);
      initial = { ...initial, ...mapped };
    }

    // Overlay localStorage (most recent edits)
    if (Object.keys(saved.formData).length > 0) {
      initial = { ...initial, ...saved.formData };
    }
    if (saved.images.photo) setImages((prev) => ({ ...prev, photo: saved.images.photo }));
    if (saved.images.signature) setImages((prev) => ({ ...prev, signature: saved.images.signature }));

    // Auto-fill branch / email / signature date
    if (!initial.dojo_branch) initial.dojo_branch = partnerName;
    if (!initial.dojo_location) initial.dojo_location = partnerLocation;
    if (!initial.email && userEmail) initial.email = userEmail;
    if (!initial.signature_date) {
      initial.signature_date = new Date().toISOString().split('T')[0];
    }

    setFormData(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save on every change
  useEffect(() => {
    if (Object.keys(formData).length > 0) {
      saveFormToLocalStorage(course.id, formData, images);
    }
  }, [formData, images, course.id]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const updateField = useCallback((fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  const handleImageChange = useCallback(
    (type: 'photo' | 'signature') => (dataUrl: string | undefined) => {
      setImages((prev) => ({ ...prev, [type]: dataUrl }));
    },
    []
  );

  // Section navigation
  const sectionIds = FORM_SECTIONS.map((s) => s.id);

  const goToSection = useCallback(
    (index: number) => {
      if (index < 0 || index >= sectionIds.length) return;
      setDirection(index > currentSection ? 1 : -1);
      setCurrentSection(index);
      scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [currentSection, sectionIds.length]
  );

  const handleNext = useCallback(() => {
    const sectionId = sectionIds[currentSection];

    // Validate form sections (not payment/review)
    if (sectionId !== 'payment' && sectionId !== 'review' && sectionId !== 'images') {
      const sectionErrors = validateSection(sectionId, formData);
      if (Object.keys(sectionErrors).length > 0) {
        setErrors(sectionErrors);
        toast.error('Please fill in all required fields');
        return;
      }
    }

    // Validate images section
    if (sectionId === 'images') {
      if (!images.photo) {
        toast.error('Passport photo is required');
        return;
      }
    }

    // Validate payment
    if (sectionId === 'payment') {
      if (!transactionId.trim()) {
        toast.error('Transaction ID is required');
        return;
      }
    }

    goToSection(currentSection + 1);
  }, [currentSection, sectionIds, formData, images.photo, transactionId, goToSection]);

  const handlePrev = useCallback(() => {
    goToSection(currentSection - 1);
  }, [currentSection, goToSection]);

  // Submit
  const handleSubmit = useCallback(async () => {
    // Full validation
    const allErrors = validateAllSections(formData);
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      toast.error('Please fix all errors before submitting');
      // Go to first errored section
      for (let i = 0; i < sectionIds.length; i++) {
        const secFields = getFieldsBySection(sectionIds[i]);
        if (secFields.some((f) => allErrors[f.id])) {
          goToSection(i);
          break;
        }
      }
      return;
    }

    if (!images.photo) {
      toast.error('Passport photo is required');
      goToSection(sectionIds.indexOf('images'));
      return;
    }

    if (!transactionId.trim()) {
      toast.error('Transaction ID is required');
      goToSection(sectionIds.indexOf('payment'));
      return;
    }

    setSubmitting(true);

    try {
      // Build student info for the API
      const studentInfo = {
        ...formData,
        hasPhoto: !!images.photo,
        hasSignature: !!images.signature,
      };

      // Build onboarding data
      const onboardingPayload = mapFormDataToOnboarding(formData);

      // Step 1: Create application + auto-onboard
      const createRes = await fetch('/api/enrollments/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          studentInfo,
          onboardingData: onboardingPayload,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create application');
      }

      const { applicationId: appId } = await createRes.json();
      setApplicationId(appId);

      // Step 2: Submit payment
      const payRes = await fetch(`/api/enrollments/${appId}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          transactionId: transactionId.trim(),
          paymentProofUrl: paymentProofUrl.trim() || undefined,
        }),
      });

      if (!payRes.ok) {
        const err = await payRes.json();
        throw new Error(err.error || 'Failed to submit payment');
      }

      // Success!
      clearFormLocalStorage(course.id);
      setShowSuccess(true);
      toast.success('Application submitted successfully!');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to submit application'
      );
    } finally {
      setSubmitting(false);
    }
  }, [
    formData,
    images,
    transactionId,
    paymentMethod,
    paymentProofUrl,
    course.id,
    sectionIds,
    goToSection,
  ]);

  // PDF generation
  const handleDownloadPdf = useCallback(async () => {
    setIsGenerating(true);
    try {
      const pdfBytes = await fillPdfForm(formData, images);
      const safeName = formData.name_en?.replace(/[^a-zA-Z0-9]/g, '_') || 'form';
      downloadPdf(pdfBytes, `HKD_Registration_${safeName}.pdf`);
      toast.success('PDF downloaded successfully');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  }, [formData, images]);

  const handleReset = useCallback(() => {
    if (!confirm('Reset all form data? This cannot be undone.')) return;
    clearFormLocalStorage(course.id);
    const initial: PdfFormData = {};
    for (const field of FORM_FIELDS) {
      if (field.defaultValue !== undefined) initial[field.id] = field.defaultValue;
    }
    initial.dojo_branch = partnerName;
    initial.dojo_location = partnerLocation;
    initial.email = userEmail;
    initial.signature_date = new Date().toISOString().split('T')[0];
    setFormData(initial);
    setImages({});
    setErrors({});
    setCurrentSection(0);
    toast.info('Form reset');
  }, [course.id, partnerName, partnerLocation, userEmail]);

  // ---------------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------------

  const formatCurrency = (amount: number) => {
    return `৳${(amount / 100).toLocaleString()}`;
  };

  const overallCompletion = (() => {
    const formSections = FORM_SECTIONS.filter(
      (s) => s.id !== 'payment' && s.id !== 'review' && s.id !== 'images'
    );
    if (formSections.length === 0) return 0;
    const total = formSections.reduce(
      (sum, s) => sum + getSectionCompletion(s.id, formData),
      0
    );
    return Math.round(total / formSections.length);
  })();

  const currentSectionId = sectionIds[currentSection];

  // ---------------------------------------------------------------------------
  // Success screen
  // ---------------------------------------------------------------------------

  if (showSuccess) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mx-auto w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
        >
          <CheckCircle className="h-10 w-10 text-green-600" />
        </motion.div>
        <h2 className="text-2xl font-bold">Application Submitted!</h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Your enrollment application for <strong>{course.name}</strong> has been
          submitted. We&apos;ll verify your payment within 1–2 business days.
        </p>

        <div className="flex flex-wrap justify-center gap-3 pt-4">
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Filled Form
          </button>
          <button
            onClick={downloadBlankForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            <FileDown className="h-4 w-4" />
            Blank Form
          </button>
          <button
            onClick={() => router.push('/karate/courses')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Back to Courses
          </button>
        </div>

        {applicationId && (
          <p className="text-xs text-muted-foreground">
            Application ID: <span className="font-mono">{applicationId}</span>
          </p>
        )}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div ref={scrollRef} className="max-w-4xl mx-auto space-y-6">
      {/* Course header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Enroll in {course.name}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {course.shortDescription}
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground hidden sm:block">
          <div>Admission: {formatCurrency(course.admissionFee)}</div>
          <div>Monthly: {formatCurrency(course.monthlyFee)}</div>
        </div>
      </div>

      {/* Overall progress */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Overall progress</span>
          <span>{overallCompletion}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={false}
            animate={{ width: `${overallCompletion}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* Section nav bar */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
        {FORM_SECTIONS.map((section, i) => {
          const Icon = SECTION_ICONS[section.id] || CheckCircle;
          const completion =
            section.id === 'payment' || section.id === 'review' || section.id === 'images'
              ? null
              : getSectionCompletion(section.id, formData);
          const isCurrent = i === currentSection;
          const isDone = completion === 100;

          return (
            <button
              key={section.id}
              onClick={() => goToSection(i)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
                isCurrent
                  ? 'bg-accent text-accent-foreground border-accent'
                  : isDone
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800'
                    : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{section.title}</span>
              {completion !== null && !isDone && (
                <span className="text-[10px] opacity-70">{completion}%</span>
              )}
              {isDone && <CheckCircle className="h-3 w-3 text-green-600" />}
            </button>
          );
        })}
      </div>

      {/* Form content (animated) */}
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentSectionId}
            custom={direction}
            initial={{ x: direction > 0 ? 80 : -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -80 : 80, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="p-6"
          >
            {/* Section heading */}
            <SectionHeading sectionId={currentSectionId} />

            {/* Field-based sections */}
            {currentSectionId !== 'images' &&
              currentSectionId !== 'payment' &&
              currentSectionId !== 'review' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {getFieldsBySection(currentSectionId).map((field) => (
                    <FormField
                      key={field.id}
                      field={field}
                      value={formData[field.id] || ''}
                      error={errors[field.id]}
                      onChange={(val) => updateField(field.id, val)}
                    />
                  ))}
                </div>
              )}

            {/* Images section */}
            {currentSectionId === 'images' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                <ImageUpload
                  type="photo"
                  value={images.photo}
                  onChange={handleImageChange('photo')}
                />
                <ImageUpload
                  type="signature"
                  value={images.signature}
                  onChange={handleImageChange('signature')}
                />
              </div>
            )}

            {/* Payment section */}
            {currentSectionId === 'payment' && (
              <PaymentStep
                course={course}
                paymentMethod={paymentMethod}
                transactionId={transactionId}
                paymentProofUrl={paymentProofUrl}
                onPaymentMethodChange={setPaymentMethod}
                onTransactionIdChange={setTransactionId}
                onPaymentProofUrlChange={setPaymentProofUrl}
                formatCurrency={formatCurrency}
              />
            )}

            {/* Review section */}
            {currentSectionId === 'review' && (
              <ReviewStep
                formData={formData}
                images={images}
                course={course}
                paymentMethod={paymentMethod}
                transactionId={transactionId}
                formatCurrency={formatCurrency}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 pt-0 border-t mt-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentSection === 0}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Reset */}
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-muted transition-colors"
              title="Reset form"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>

            {currentSectionId !== 'review' ? (
              <button
                onClick={handleNext}
                className="inline-flex items-center gap-1 px-5 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Submit Application
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

// ===========================================================================
// Sub-components
// ===========================================================================

function SectionHeading({ sectionId }: { sectionId: string }) {
  const section = FORM_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;
  const Icon = SECTION_ICONS[sectionId] || CheckCircle;

  return (
    <div className="flex items-center gap-2 mb-1">
      <Icon className="h-5 w-5 text-accent" />
      <div>
        <h2 className="text-lg font-semibold">{section.title}</h2>
        {section.titleBn && (
          <p className="text-xs text-muted-foreground">{section.titleBn}</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormField
// ---------------------------------------------------------------------------

function FormField({
  field,
  value,
  error,
  onChange,
}: {
  field: FormFieldDef;
  value: string;
  error?: string;
  onChange: (val: string) => void;
}) {
  const isTextarea = field.type === 'textarea';
  const isSelect = field.type === 'select';
  const colSpan = isTextarea ? 'md:col-span-2' : '';

  return (
    <div className={cn('space-y-1.5', colSpan)}>
      {/* Label */}
      <label className="flex items-center gap-1 text-sm font-medium">
        <span>{field.label}</span>
        {field.required && <span className="text-destructive">*</span>}
        {field.labelBn && (
          <span className="text-xs text-muted-foreground ml-1">
            ({field.labelBn})
          </span>
        )}
      </label>

      {/* Input */}
      {isSelect ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={field.readOnly}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive'
          )}
        >
          <option value="">{field.placeholder || 'Select...'}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : isTextarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          readOnly={field.readOnly}
          maxLength={field.maxLength}
          rows={3}
          className={cn(
            'flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-destructive'
          )}
        />
      ) : (
        <input
          type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          readOnly={field.readOnly}
          maxLength={field.maxLength}
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            field.readOnly && 'bg-muted cursor-not-allowed',
            error && 'border-destructive'
          )}
        />
      )}

      {/* Help text */}
      {field.helpText && !error && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Info className="h-3 w-3" /> {field.helpText}
        </p>
      )}

      {/* Character counter */}
      {field.maxLength && value.length > 0 && (
        <p
          className={cn(
            'text-[10px]',
            value.length > field.maxLength
              ? 'text-destructive'
              : 'text-muted-foreground'
          )}
        >
          {value.length}/{field.maxLength}
        </p>
      )}

      {/* Error */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-1 text-xs text-destructive"
        >
          <AlertCircle className="h-3 w-3" /> {error}
        </motion.p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Payment step
// ---------------------------------------------------------------------------

function PaymentStep({
  course,
  paymentMethod,
  transactionId,
  paymentProofUrl,
  onPaymentMethodChange,
  onTransactionIdChange,
  onPaymentProofUrlChange,
  formatCurrency,
}: {
  course: Course;
  paymentMethod: string;
  transactionId: string;
  paymentProofUrl: string;
  onPaymentMethodChange: (v: string) => void;
  onTransactionIdChange: (v: string) => void;
  onPaymentProofUrlChange: (v: string) => void;
  formatCurrency: (n: number) => string;
}) {
  return (
    <div className="space-y-6 mt-4">
      {/* Fee summary */}
      <div className="rounded-lg bg-accent/10 p-4">
        <h3 className="font-semibold mb-2">Admission Fee</h3>
        <p className="text-2xl font-bold text-accent">
          {formatCurrency(course.admissionFee)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Monthly fee: {formatCurrency(course.monthlyFee)} (after approval)
        </p>
      </div>

      {/* Payment method selector */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Payment Method <span className="text-destructive">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {course.bkashNumber && (
            <button
              type="button"
              onClick={() => onPaymentMethodChange('bkash')}
              className={cn(
                'p-3 border-2 rounded-lg text-center transition-colors',
                paymentMethod === 'bkash'
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/20'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <div className="text-xl mb-1">🔴</div>
              <div className="text-xs font-medium">bKash</div>
            </button>
          )}
          {course.nagadNumber && (
            <button
              type="button"
              onClick={() => onPaymentMethodChange('nagad')}
              className={cn(
                'p-3 border-2 rounded-lg text-center transition-colors',
                paymentMethod === 'nagad'
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <div className="text-xl mb-1">🟠</div>
              <div className="text-xs font-medium">Nagad</div>
            </button>
          )}
          {course.rocketNumber && (
            <button
              type="button"
              onClick={() => onPaymentMethodChange('rocket')}
              className={cn(
                'p-3 border-2 rounded-lg text-center transition-colors',
                paymentMethod === 'rocket'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                  : 'border-border hover:border-muted-foreground/50'
              )}
            >
              <div className="text-xl mb-1">🟣</div>
              <div className="text-xs font-medium">Rocket</div>
            </button>
          )}
        </div>
      </div>

      {/* bKash instructions */}
      {paymentMethod === 'bkash' && course.bkashNumber && (
        <div className="rounded-lg bg-pink-50 dark:bg-pink-950/20 p-4">
          <h4 className="font-semibold mb-2 text-pink-900 dark:text-pink-300">
            bKash Payment Instructions
          </h4>
          <ol className="list-decimal list-inside text-sm space-y-1 text-pink-800 dark:text-pink-300/80">
            <li>Open bKash App</li>
            <li>
              Go to &quot;Send Money&quot; → Number:{' '}
              <span className="font-mono font-bold">{course.bkashNumber}</span>
            </li>
            <li>Amount: {formatCurrency(course.admissionFee)}</li>
            <li>Reference: Your Full Name</li>
            <li>Note down the Transaction ID</li>
          </ol>
          {course.bkashQrCodeUrl && (
            <div className="mt-3">
              <p className="text-sm mb-1 text-pink-800 dark:text-pink-300/80">
                Or scan the QR code:
              </p>
              <div className="bg-white p-2 rounded-lg inline-block">
                <Image
                  src={course.bkashQrCodeUrl}
                  alt="bKash QR"
                  width={160}
                  height={160}
                  className="rounded"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Transaction ID <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={transactionId}
            onChange={(e) => onTransactionIdChange(e.target.value)}
            placeholder="e.g., TXN123456789"
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm font-mono shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">
            Payment Screenshot URL{' '}
            <span className="text-xs text-muted-foreground">(optional)</span>
          </label>
          <input
            type="url"
            value={paymentProofUrl}
            onChange={(e) => onPaymentProofUrlChange(e.target.value)}
            placeholder="https://i.imgur.com/..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review step
// ---------------------------------------------------------------------------

function ReviewStep({
  formData,
  images,
  course,
  paymentMethod,
  transactionId,
  formatCurrency,
}: {
  formData: PdfFormData;
  images: ImageData;
  course: Course;
  paymentMethod: string;
  transactionId: string;
  formatCurrency: (n: number) => string;
}) {
  const reviewSections = FORM_SECTIONS.filter(
    (s) => s.id !== 'payment' && s.id !== 'review' && s.id !== 'images'
  );

  return (
    <div className="space-y-4 mt-4">
      {/* Form data review */}
      {reviewSections.map((section) => {
        const fields = getFieldsBySection(section.id);
        return (
          <div key={section.id} className="rounded-lg bg-muted/50 p-4">
            <h3 className="font-medium text-sm mb-2">{section.title}</h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {fields.map((f) => {
                const val = formData[f.id];
                if (!val) return null;
                return (
                  <div key={f.id} className="flex gap-1">
                    <dt className="text-muted-foreground whitespace-nowrap">
                      {f.label}:
                    </dt>
                    <dd className="font-medium truncate">{val}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}

      {/* Images review */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h3 className="font-medium text-sm mb-2">Photo & Signature</h3>
        <div className="flex gap-4">
          {images.photo && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Photo</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images.photo}
                alt="Photo"
                className="h-20 w-auto rounded border"
              />
            </div>
          )}
          {images.signature && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Signature</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images.signature}
                alt="Signature"
                className="h-12 w-auto rounded border"
              />
            </div>
          )}
        </div>
      </div>

      {/* Payment review */}
      <div className="rounded-lg bg-muted/50 p-4">
        <h3 className="font-medium text-sm mb-2">Payment</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
          <dt className="text-muted-foreground">Course:</dt>
          <dd className="font-medium">{course.name}</dd>
          <dt className="text-muted-foreground">Admission Fee:</dt>
          <dd className="font-medium text-accent">
            {formatCurrency(course.admissionFee)}
          </dd>
          <dt className="text-muted-foreground">Method:</dt>
          <dd className="font-medium capitalize">{paymentMethod}</dd>
          <dt className="text-muted-foreground">Transaction ID:</dt>
          <dd className="font-medium font-mono">{transactionId}</dd>
        </dl>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-yellow-300 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-300">
          By submitting, I confirm all information is accurate. The admission fee is
          non-refundable and enrollment is subject to admin approval after payment
          verification.
        </p>
      </div>
    </div>
  );
}
