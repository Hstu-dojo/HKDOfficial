// Form field definitions for HSTU Karate Dojo PDF Form
// Field IDs mapped from the PDF AcroForm fields

export interface FormFieldDef {
  id: string;
  pdfFieldId: string;
  label: string;
  labelBn?: string;
  placeholder?: string;
  type: 'text' | 'textarea' | 'date' | 'email' | 'tel' | 'number' | 'select';
  required: boolean;
  maxLength?: number;
  section: string;
  helpText?: string;
  readOnly?: boolean;
  defaultValue?: string;
  options?: { value: string; label: string }[];
}

export const FORM_SECTIONS = [
  { id: 'basic', title: 'Basic Information', titleBn: 'মৌলিক তথ্য', icon: 'User' },
  { id: 'contact', title: 'Contact Details', titleBn: 'যোগাযোগের তথ্য', icon: 'Phone' },
  { id: 'student', title: 'Student Details', titleBn: 'শিক্ষার্থীর তথ্য', icon: 'GraduationCap' },
  { id: 'family', title: 'Family Information', titleBn: 'পারিবারিক তথ্য', icon: 'Users' },
  { id: 'physical', title: 'Physical Details', titleBn: 'শারীরিক তথ্য', icon: 'Activity' },
  { id: 'activities', title: 'Activities & Motive', titleBn: 'কার্যক্রম ও উদ্দেশ্য', icon: 'Target' },
  { id: 'branch', title: 'Branch & Registration', titleBn: 'শাখা ও নিবন্ধন', icon: 'MapPin' },
  { id: 'images', title: 'Photo & Signature', titleBn: 'ছবি ও স্বাক্ষর', icon: 'Camera' },
  { id: 'payment', title: 'Payment', titleBn: 'পেমেন্ট', icon: 'CreditCard' },
  { id: 'review', title: 'Review & Submit', titleBn: 'পর্যালোচনা ও জমা', icon: 'CheckCircle' },
] as const;

export const FORM_FIELDS: FormFieldDef[] = [
  // === Basic Information ===
  {
    id: 'name_en', pdfFieldId: 'text_2gcgy',
    label: 'Full Name (English)', labelBn: 'নাম (ইংরেজি)',
    placeholder: 'Enter your full name in English',
    type: 'text', required: true, maxLength: 100, section: 'basic',
  },
  {
    id: 'name_bn', pdfFieldId: 'text_3zwog',
    label: 'Full Name (Bangla)', labelBn: 'নাম (বাংলা)',
    placeholder: 'বাংলায় পূর্ণ নাম লিখুন',
    type: 'text', required: true, maxLength: 100, section: 'basic',
  },
  {
    id: 'dob', pdfFieldId: 'text_8qsa',
    label: 'Date of Birth', labelBn: 'জন্ম তারিখ',
    placeholder: 'DD/MM/YYYY',
    type: 'date', required: true, section: 'basic',
  },
  {
    id: 'nationality', pdfFieldId: 'text_10itmk',
    label: 'Nationality', labelBn: 'জাতীয়তা',
    placeholder: 'e.g., Bangladeshi',
    type: 'text', required: true, maxLength: 50, section: 'basic',
    defaultValue: 'Bangladeshi',
  },
  {
    id: 'religion', pdfFieldId: 'text_32ijag',
    label: 'Religion', labelBn: 'ধর্ম',
    placeholder: 'e.g., Islam',
    type: 'text', required: true, maxLength: 50, section: 'basic',
  },
  {
    id: 'nid', pdfFieldId: 'text_11eyhm',
    label: 'NID / Birth Certificate / Passport No.', labelBn: 'জাতীয় পরিচয়পত্র / জন্ম নিবন্ধন / পাসপোর্ট নং',
    placeholder: 'Enter your ID number',
    type: 'text', required: true, maxLength: 50, section: 'basic',
  },

  // === Contact Details ===
  {
    id: 'present_address', pdfFieldId: 'text_6qwqa',
    label: 'Present Address', labelBn: 'বর্তমান ঠিকানা',
    placeholder: 'Enter your current address',
    type: 'textarea', required: true, maxLength: 200, section: 'contact',
  },
  {
    id: 'permanent_address', pdfFieldId: 'text_7rkjm',
    label: 'Permanent Address', labelBn: 'স্থায়ী ঠিকানা',
    placeholder: 'Enter your permanent address',
    type: 'textarea', required: true, maxLength: 200, section: 'contact',
  },
  {
    id: 'mobile', pdfFieldId: 'text_12jovw',
    label: 'Mobile Number', labelBn: 'মোবাইল নম্বর',
    placeholder: '01XXXXXXXXX',
    type: 'tel', required: true, maxLength: 15, section: 'contact',
  },
  {
    id: 'email', pdfFieldId: 'text_33yqgf',
    label: 'Email Address', labelBn: 'ইমেইল',
    placeholder: 'your.email@example.com',
    type: 'email', required: false, maxLength: 100, section: 'contact',
  },
  {
    id: 'emergency_contact', pdfFieldId: 'text_13xzow',
    label: 'Emergency Contact Number', labelBn: 'জরুরি যোগাযোগ নম্বর',
    placeholder: '01XXXXXXXXX',
    type: 'tel', required: true, maxLength: 15, section: 'contact',
  },
  {
    id: 'emergency_relation', pdfFieldId: 'text_35dbko',
    label: 'Relationship with Emergency Contact', labelBn: 'জরুরি যোগাযোগকারীর সাথে সম্পর্ক',
    placeholder: 'e.g., Mother, Father, Brother',
    type: 'text', required: true, maxLength: 50, section: 'contact',
  },

  // === Student Details ===
  {
    id: 'occupation', pdfFieldId: 'text_14frao',
    label: 'Occupation', labelBn: 'পেশা',
    placeholder: 'e.g., Student',
    type: 'text', required: true, maxLength: 50, section: 'student',
    defaultValue: 'Student',
  },
  {
    id: 'institution', pdfFieldId: 'text_15nxit',
    label: 'Name of Institution', labelBn: 'প্রতিষ্ঠানের নাম',
    placeholder: 'Enter your institution name',
    type: 'text', required: true, maxLength: 100, section: 'student',
  },
  {
    id: 'level_class', pdfFieldId: 'text_16hvzz',
    label: 'Level / Class', labelBn: 'শ্রেণী / স্তর',
    placeholder: 'e.g., Class 10, BSc 2nd Year',
    type: 'text', required: true, maxLength: 50, section: 'student',
  },
  {
    id: 'roll_id', pdfFieldId: 'text_17wput',
    label: 'ID / Roll Number', labelBn: 'আইডি / রোল নম্বর',
    placeholder: 'Enter your student ID or roll number',
    type: 'text', required: true, maxLength: 50, section: 'student',
  },
  {
    id: 'faculty_dept', pdfFieldId: 'text_36rbtt',
    label: 'Faculty / Department / Section', labelBn: 'অনুষদ / বিভাগ / শাখা',
    placeholder: 'e.g., Science / Physics / A',
    type: 'text', required: false, maxLength: 100, section: 'student',
  },

  // === Family Information ===
  {
    id: 'father_name', pdfFieldId: 'text_4juqg',
    label: "Father's Name", labelBn: 'পিতার নাম',
    placeholder: "Enter father's full name",
    type: 'text', required: true, maxLength: 100, section: 'family',
  },
  {
    id: 'mother_name', pdfFieldId: 'text_5eyrb',
    label: "Mother's Name", labelBn: 'মাতার নাম',
    placeholder: "Enter mother's full name",
    type: 'text', required: true, maxLength: 100, section: 'family',
  },
  {
    id: 'father_occupation', pdfFieldId: 'text_26lzic',
    label: "Father's Occupation", labelBn: 'পিতার পেশা',
    placeholder: 'e.g., Businessman',
    type: 'text', required: true, maxLength: 50, section: 'family',
  },
  {
    id: 'mother_occupation', pdfFieldId: 'text_27orzd',
    label: "Mother's Occupation", labelBn: 'মাতার পেশা',
    placeholder: 'e.g., Teacher',
    type: 'text', required: true, maxLength: 50, section: 'family',
  },

  // === Physical Details ===
  {
    id: 'age', pdfFieldId: 'text_28tdwn',
    label: 'Age', labelBn: 'বয়স',
    placeholder: 'e.g., 16',
    type: 'text', required: true, maxLength: 5, section: 'physical',
  },
  {
    id: 'height', pdfFieldId: 'text_9hslb',
    label: 'Height', labelBn: 'উচ্চতা',
    placeholder: 'e.g., 5\'8"',
    type: 'text', required: true, maxLength: 20, section: 'physical',
  },
  {
    id: 'weight', pdfFieldId: 'text_29lyqz',
    label: 'Weight', labelBn: 'ওজন',
    placeholder: 'e.g., 58 kg',
    type: 'text', required: true, maxLength: 20, section: 'physical',
  },
  {
    id: 'blood_group', pdfFieldId: 'text_30ipgl',
    label: 'Blood Group', labelBn: 'রক্তের গ্রুপ',
    placeholder: 'Select your blood group',
    type: 'select', required: true, section: 'physical',
    options: [
      { value: 'A+', label: 'A+' }, { value: 'A-', label: 'A-' },
      { value: 'B+', label: 'B+' }, { value: 'B-', label: 'B-' },
      { value: 'AB+', label: 'AB+' }, { value: 'AB-', label: 'AB-' },
      { value: 'O+', label: 'O+' }, { value: 'O-', label: 'O-' },
    ],
  },
  {
    id: 'bmi', pdfFieldId: 'text_31mqrf',
    label: 'BMI (Optional)', labelBn: 'বিএমআই (ঐচ্ছিক)',
    placeholder: 'e.g., 21.5',
    type: 'text', required: false, maxLength: 10, section: 'physical',
    helpText: 'Body Mass Index — auto-calculated if height/weight provided',
  },

  // === Activities & Motive ===
  {
    id: 'activities_first', pdfFieldId: 'text_37umsg',
    label: 'Activities (Short)', labelBn: 'কার্যক্রম (সংক্ষিপ্ত)',
    placeholder: 'e.g., Football, Reading',
    type: 'text', required: false, maxLength: 20, section: 'activities',
    helpText: 'Max 20 characters — brief summary',
  },
  {
    id: 'activities_last', pdfFieldId: 'text_18yymw',
    label: 'Activities (Detailed)', labelBn: 'কার্যক্রম (বিস্তারিত)',
    placeholder: 'Describe your activities...',
    type: 'textarea', required: false, maxLength: 200, section: 'activities',
  },
  {
    id: 'motive_first', pdfFieldId: 'text_19szou',
    label: 'Motive for Training (Part 1)', labelBn: 'প্রশিক্ষণের উদ্দেশ্য (অংশ ১)',
    placeholder: 'Why do you want to learn karate?',
    type: 'textarea', required: true, maxLength: 200, section: 'activities',
  },
  {
    id: 'motive_last', pdfFieldId: 'text_20wqom',
    label: 'Motive for Training (Part 2)', labelBn: 'প্রশিক্ষণের উদ্দেশ্য (অংশ ২)',
    placeholder: 'Continue describing your goals...',
    type: 'textarea', required: false, maxLength: 200, section: 'activities',
  },

  // === Branch & Registration ===
  {
    id: 'registration_no', pdfFieldId: 'text_23aqm',
    label: 'Registration Number', labelBn: 'নিবন্ধন নম্বর',
    placeholder: 'Assigned by authority',
    type: 'text', required: false, maxLength: 50, section: 'branch',
    readOnly: true, defaultValue: '',
  },
  {
    id: 'dojo_branch', pdfFieldId: 'text_24fdfi',
    label: 'Karate Dojo Branch', labelBn: 'কারাতে ডোজো শাখা',
    placeholder: 'e.g., HSTU Main Branch',
    type: 'text', required: true, maxLength: 100, section: 'branch',
  },
  {
    id: 'dojo_location', pdfFieldId: 'text_25csjw',
    label: 'Karate Dojo Location', labelBn: 'কারাতে ডোজো অবস্থান',
    placeholder: 'e.g., HSTU Campus',
    type: 'text', required: true, maxLength: 100, section: 'branch',
  },
  {
    id: 'signature_date', pdfFieldId: 'text_38egdr',
    label: 'Signature Date', labelBn: 'স্বাক্ষরের তারিখ',
    placeholder: 'Auto-filled with today\'s date',
    type: 'date', required: true, section: 'branch',
  },
  {
    id: 'authority_date', pdfFieldId: 'text_39tajn',
    label: 'Authority Signature Date', labelBn: 'কর্তৃপক্ষের স্বাক্ষরের তারিখ',
    placeholder: 'For authority use',
    type: 'text', required: false, readOnly: true, defaultValue: '', section: 'branch',
  },
];

// Image positions on the PDF
export const PHOTO_BOX = { x: 477.36, y: 623.04, width: 83.52, height: 90 };

export const SIGNATURE_POSITIONS = {
  student: { x: 35, y: 59, width: 115, height: 46 },
  authority: { x: 428, y: 59, width: 115, height: 46 },
};

export const PAGE_DIMENSIONS = { width: 595.389, height: 841.918 };

// PDF field coordinates extracted from the actual PDF
export const FIELD_COORDS: Record<string, { x: number; y: number; w: number; h: number }> = {
  text_2gcgy:  { x: 193, y: 605, w: 364, h: 11 },
  text_3zwog:  { x: 193, y: 584, w: 364, h: 11 },
  text_4juqg:  { x: 193, y: 553, w: 228, h: 11 },
  text_5eyrb:  { x: 193, y: 518, w: 229, h: 11 },
  text_6qwqa:  { x: 193, y: 497, w: 364, h: 11 },
  text_7rkjm:  { x: 193, y: 477, w: 364, h: 11 },
  text_8qsa:   { x: 193, y: 456, w: 101, h: 11 },
  text_9hslb:  { x: 193, y: 436, w: 102, h: 11 },
  text_10itmk: { x: 193, y: 415, w: 103, h: 11 },
  text_11eyhm: { x: 193, y: 394, w: 364, h: 11 },
  text_12jovw: { x: 193, y: 374, w: 148, h: 11 },
  text_13xzow: { x: 193, y: 353, w: 210, h: 11 },
  text_14frao: { x: 193, y: 308, w: 364, h: 11 },
  text_15nxit: { x: 193, y: 288, w: 364, h: 11 },
  text_16hvzz: { x: 193, y: 267, w: 364, h: 11 },
  text_17wput: { x: 193, y: 246, w: 97,  h: 11 },
  text_18yymw: { x: 193, y: 205, w: 364, h: 11 },
  text_19szou: { x: 193, y: 184, w: 364, h: 11 },
  text_20wqom: { x: 194, y: 163, w: 364, h: 11 },
  text_23aqm:  { x: 90,  y: 672, w: 93,  h: 11 },
  text_24fdfi: { x: 239, y: 711, w: 180, h: 11 },
  text_25csjw: { x: 279, y: 697, w: 96,  h: 11 },
  text_26lzic: { x: 481, y: 553, w: 76,  h: 11 },
  text_27orzd: { x: 481, y: 519, w: 76,  h: 11 },
  text_28tdwn: { x: 319, y: 456, w: 101, h: 11 },
  text_29lyqz: { x: 336, y: 436, w: 86,  h: 11 },
  text_30ipgl: { x: 487, y: 456, w: 71,  h: 11 },
  text_31mqrf: { x: 448, y: 436, w: 109, h: 11 },
  text_32ijag: { x: 342, y: 414, w: 215, h: 11 },
  text_33yqgf: { x: 378, y: 374, w: 178, h: 11 },
  text_35dbko: { x: 448, y: 353, w: 108, h: 11 },
  text_36rbtt: { x: 331, y: 246, w: 226, h: 11 },
  text_37umsg: { x: 493, y: 225, w: 64,  h: 11 },
  text_38egdr: { x: 66,  y: 25,  w: 84,  h: 11 },
  text_39tajn: { x: 458, y: 25,  w: 84,  h: 11 },
};

export const IMAGE_CONSTRAINTS = {
  photo: {
    maxSizeMB: 5,
    maxSizeBytes: 5 * 1024 * 1024,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    minWidth: 150, minHeight: 180, maxWidth: 2000, maxHeight: 2400,
    recommendedWidth: 300, recommendedHeight: 360,
    aspectRatioMin: 0.6, aspectRatioMax: 1.0,
  },
  signature: {
    maxSizeMB: 2,
    maxSizeBytes: 2 * 1024 * 1024,
    acceptedTypes: ['image/jpeg', 'image/png', 'image/jpg'],
    minWidth: 50, minHeight: 20, maxWidth: 2000, maxHeight: 1000,
    recommendedWidth: 400, recommendedHeight: 150,
    aspectRatioMin: 0.5, aspectRatioMax: 8.0,
  },
};

// -------------------------------------------------------------------
// Mapping helpers: onboarding data <-> PDF form field IDs
// -------------------------------------------------------------------

/** Map onboarding notes JSON → PDF form field IDs */
export function mapOnboardingToFormData(
  onboarding: Record<string, unknown>
): Record<string, string> {
  const s = (v: unknown) => (v != null ? String(v) : '');

  const facultyParts = [s(onboarding.faculty), s(onboarding.dept)].filter(Boolean);

  return {
    name_en: s(onboarding.username),
    name_bn: s(onboarding.usernameBn),
    dob: s(onboarding.dob),
    nationality: s(onboarding.nationality) || 'Bangladeshi',
    religion: s(onboarding.religion),
    nid: s(onboarding.nid),
    present_address: s(onboarding.address),
    permanent_address: s(onboarding.permanentAddress),
    mobile: s(onboarding.phone),
    email: s(onboarding.email),
    emergency_contact: s(onboarding.emergencyPhone),
    emergency_relation: s(onboarding.emergencyRelation),
    occupation: s(onboarding.occupation) || 'Student',
    institution: s(onboarding.institute),
    level_class: s(onboarding.levelClass),
    roll_id: s(onboarding.rollId),
    faculty_dept: facultyParts.join(' / '),
    father_name: s(onboarding.fatherName),
    mother_name: s(onboarding.motherName),
    father_occupation: s(onboarding.fatherOccupation),
    mother_occupation: s(onboarding.motherOccupation),
    age: s(onboarding.age),
    height: s(onboarding.height),
    weight: s(onboarding.weight),
    blood_group: s(onboarding.bloodGroup),
    bmi: s(onboarding.bmi),
    activities_first: s(onboarding.activitiesShort),
    activities_last: s(onboarding.activitiesDetail),
    motive_first: s(onboarding.motive),
    motive_last: '',
  };
}

/** Convert PDF form field IDs back to onboarding-compatible JSON */
export function mapFormDataToOnboarding(
  formData: Record<string, string>
): Record<string, string | number | boolean> {
  const parts = (formData.faculty_dept || '').split('/').map((s) => s.trim());

  return {
    username: formData.name_en || '',
    usernameBn: formData.name_bn || '',
    dob: formData.dob || '',
    nationality: formData.nationality || 'Bangladeshi',
    religion: formData.religion || '',
    nid: formData.nid || '',
    address: formData.present_address || '',
    permanentAddress: formData.permanent_address || '',
    phone: formData.mobile || '',
    email: formData.email || '',
    emergencyContact: '',
    emergencyPhone: formData.emergency_contact || '',
    emergencyRelation: formData.emergency_relation || '',
    occupation: formData.occupation || 'Student',
    institute: formData.institution || '',
    levelClass: formData.level_class || '',
    rollId: formData.roll_id || '',
    faculty: parts[0] || '',
    dept: parts[1] || '',
    session: '',
    fatherName: formData.father_name || '',
    fatherOccupation: formData.father_occupation || '',
    motherName: formData.mother_name || '',
    motherOccupation: formData.mother_occupation || '',
    age: Number(formData.age) || 0,
    height: Number(formData.height) || 0,
    weight: Number(formData.weight) || 0,
    sex: '',
    bloodGroup: formData.blood_group || '',
    bmi: formData.bmi || '',
    activitiesShort: formData.activities_first || '',
    activitiesDetail: formData.activities_last || '',
    motive: formData.motive_first || '',
    agreement: true,
  };
}

/** Get all fields for a given section */
export function getFieldsBySection(sectionId: string): FormFieldDef[] {
  return FORM_FIELDS.filter((f) => f.section === sectionId);
}

/** Get required fields for a given section */
export function getRequiredFieldsBySection(sectionId: string): FormFieldDef[] {
  return FORM_FIELDS.filter((f) => f.section === sectionId && f.required);
}

/** Calculate section completion percentage */
export function getSectionCompletion(
  sectionId: string,
  formData: Record<string, string>
): number {
  const fields = getFieldsBySection(sectionId);
  if (fields.length === 0) return 100;
  const filled = fields.filter(
    (f) => formData[f.id] !== undefined && formData[f.id] !== ''
  );
  return Math.round((filled.length / fields.length) * 100);
}

/** Validate a single section, returning error messages by field ID */
export function validateSection(
  sectionId: string,
  formData: Record<string, string>
): Record<string, string> {
  const errors: Record<string, string> = {};
  const fields = getFieldsBySection(sectionId);

  for (const field of fields) {
    const value = formData[field.id] || '';
    if (field.required && !value.trim()) {
      errors[field.id] = `${field.label} is required`;
    }
    if (field.maxLength && value.length > field.maxLength) {
      errors[field.id] = `Maximum ${field.maxLength} characters`;
    }
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[field.id] = 'Please enter a valid email address';
    }
  }

  return errors;
}

/** Validate all form sections, returning errors by field ID */
export function validateAllSections(
  formData: Record<string, string>
): Record<string, string> {
  let errors: Record<string, string> = {};
  const formSectionIds = FORM_SECTIONS.filter(
    (s) => s.id !== 'payment' && s.id !== 'review'
  );
  for (const section of formSectionIds) {
    errors = { ...errors, ...validateSection(section.id, formData) };
  }
  return errors;
}
