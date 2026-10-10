import { requireAdminPageAccess } from '@/lib/rbac/page-access';
import SignatureManagement from "@/components/admin/certificates/SignatureManagement";

export const metadata = {
  title: "Certificate Signatures | Admin",
  description: "Manage reusable signatures for program certificates",
};

export default async function SignaturesPage() {
  await requireAdminPageAccess('/admin/programs/signatures');
  return <SignatureManagement />;
}
