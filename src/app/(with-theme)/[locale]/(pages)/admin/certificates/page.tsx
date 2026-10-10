import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import CertificatesOverview from "@/components/admin/certificates/CertificatesOverview";

export const metadata = {
  title: "Certificates | Admin",
  description: "Overview of all program certificates",
};

export default async function CertificatesPage() {
  await requireAdminPageAccess('/admin/certificates');
  return <CertificatesOverview />;
}
