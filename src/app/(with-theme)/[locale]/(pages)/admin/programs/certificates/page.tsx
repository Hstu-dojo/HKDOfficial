import ProgramCertificateManagement from "@/components/admin/certificates/ProgramCertificateManagement";
import { Suspense } from "react";

export const metadata = {
  title: "Program Certificates | Admin",
  description: "Manage certificate eligibility and issuance for a program",
};

export default function ProgramCertificatesPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    }>
      <ProgramCertificateManagement />
    </Suspense>
  );
}
