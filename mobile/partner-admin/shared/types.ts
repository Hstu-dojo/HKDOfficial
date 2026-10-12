export type PartnerUser = {
  id: string;
  email: string;
  name: string;
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
};
export type Session = {
  token: string;
  origin: string;
  expiresAt: string;
  user: PartnerUser;
};
export type Course = {
  id: string;
  name: string;
  organization: string;
  isActive: boolean;
};
export const attendanceStatuses = [
  "present",
  "absent",
  "late",
  "excused",
] as const;
export type AttendanceStatus = (typeof attendanceStatuses)[number];
export type Student = { profileId: string; name: string; memberNumber: string };
export type AttendanceRow = Student & {
  status: AttendanceStatus | "unmarked";
  notes: string;
};
export type Register = {
  id: string;
  date: string;
  label: string;
  notes: string;
  records: AttendanceRow[];
  updatedAt: string;
};
export type Client = <T>(path: string, body?: unknown) => Promise<T>;
