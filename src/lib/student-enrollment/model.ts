import { z } from "zod";
import { FORM_FIELDS, FORM_SECTIONS } from "@/lib/pdf/form-fields";
export const enrollmentFields = FORM_FIELDS.filter(
  (field) => !["payment", "review", "images", "branch"].includes(field.section),
);
export const enrollmentSections = FORM_SECTIONS.filter((section) =>
  enrollmentFields.some((field) => field.section === section.id),
);
const shape: Record<string, z.ZodString> = {};
for (const field of enrollmentFields)
  shape[field.id] = z
    .string()
    .trim()
    .max(field.maxLength || 1000);
shape.registration_no = z.string().trim().max(100);
shape.gender = z.string().trim().max(20);
shape.medical_condition = z.string().trim().max(20);
shape.medical_details = z.string().trim().max(1000);
shape.emergency_name = z.string().trim().max(150);
export const fieldsSchema = z.object(shape).strict();
export const blankFields = Object.fromEntries(
  Object.keys(shape).map((key) => [key, ""]),
);
export const boxSchema = z
  .tuple([
    z.number().min(0).max(1000),
    z.number().min(0).max(1000),
    z.number().min(0).max(1000),
    z.number().min(0).max(1000),
  ])
  .refine(
    ([y1, x1, y2, x2]) => y2 > y1 && x2 > x1,
    "Crop must have positive width and height",
  );
export const extractionSchema = z
  .object({
    fields: fieldsSchema,
    warnings: z.array(z.string().max(300)).max(40),
    photoBox: boxSchema.nullable(),
    signatureBox: boxSchema.nullable(),
    courseId: z.string().max(100).optional().default(""),
  })
  .strict();
export const submitSchema = z
  .object({
    draftId: z.string().uuid(),
    courseId: z
      .string()
      .min(1, "Select an available organization course")
      .max(100),
    fields: fieldsSchema,
    photoBox: boxSchema.nullable(),
    signatureBox: boxSchema.nullable(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    paymentCollected: z.boolean(),
    paymentReference: z.string().trim().max(150),
    agreement: z.literal(true),
    reviewed: z.literal(true),
  })
  .strict()
  .superRefine((data, ctx) => {
    for (const key of ["name_en", "dob", "mobile", "present_address"])
      if (!data.fields[key])
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["fields", key],
          message: "Required",
        });
    if (!z.string().email().safeParse(data.fields.email).success)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fields", "email"],
        message: "A reviewed email is required to create the account",
      });
    if (!["", "male", "female", "other"].includes(data.fields.gender))
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fields", "gender"],
        message: "Use male, female, other, or leave gender not recorded",
      });
    for (const value of [data.fields.dob, data.startDate])
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) ||
        new Date(value).toISOString().slice(0, 10) !== value
      )
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Use a valid date",
        });
    if (
      Number.isFinite(Date.parse(data.fields.dob)) &&
      Date.parse(data.fields.dob) > Date.now()
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Birth date cannot be in the future",
      });
  });
/** IDs always come from the organization's available courses, never invented by AI. */
export function enrollmentCourseId(courses: { id: string }[], suggested = "") {
  return (
    courses.find((course) => course.id === suggested)?.id ||
    courses[0]?.id ||
    ""
  );
}
export const documentKinds = [
  "registration_form",
  "photo",
  "signature",
  "birth_certificate",
  "identity",
  "medical",
  "other",
] as const;
export const documentKindSchema = z.enum(documentKinds);
export function folderPart(name: string) {
  return (
    name
      .normalize("NFKD")
      .replace(/[^a-zA-Z0-9\u0980-\u09ff-]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 70) || "student"
  );
}
export function studentFolder(
  partner: { name: string; id: string },
  profile: { name: string; id: string },
) {
  return `students/${folderPart(partner.name)}--${partner.id}/${folderPart(profile.name)}--${profile.id}`;
}

/** Read both older studentInfo objects and the unified form's field IDs. */
export function studentFormValues(
  info: Record<string, unknown>,
  profile: Record<string, unknown> = {},
) {
  const aliases: Record<string, string[]> = {
    name_en: ["fullNameEnglish", "username"],
    name_bn: ["fullNameBangla"],
    dob: ["dateOfBirth", "dob"],
    mobile: ["phoneNumber", "phone"],
    email: ["email"],
    present_address: ["presentAddress", "address"],
    permanent_address: ["permanentAddress"],
    father_name: ["fatherName"],
    mother_name: ["motherName"],
    institution: ["institute"],
    faculty_dept: ["faculty", "department"],
    level_class: ["educationQualification"],
    occupation: ["profession"],
    blood_group: ["bloodGroup"],
    emergency_contact: ["emergencyContactPhone", "emergencyPhone"],
    emergency_relation: ["emergencyContactRelation"],
    emergency_name: ["emergencyContactName", "emergencyContact"],
    gender: ["gender", "sex"],
  };
  const result: Record<string, string> = {};
  for (const key of Object.keys(blankFields)) {
    const sourceKeys = [key, ...(aliases[key] || [])];
    const value =
      sourceKeys
        .map((name) => info[name])
        .find(
          (value) => value !== null && value !== undefined && value !== "",
        ) ??
      sourceKeys
        .map((name) => profile[name])
        .find((value) => value !== null && value !== undefined && value !== "");
    result[key] =
      typeof value === "string" || typeof value === "number"
        ? String(value)
        : "";
    if (key === "dob") result[key] = result[key].slice(0, 10);
  }
  return result;
}
