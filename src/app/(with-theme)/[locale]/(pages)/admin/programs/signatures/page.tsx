import SignatureManagement from "@/components/admin/certificates/SignatureManagement";

export const metadata = {
  title: "Certificate Signatures | Admin",
  description: "Manage reusable signatures for program certificates",
};

export default function SignaturesPage() {
  return <SignatureManagement />;
}
