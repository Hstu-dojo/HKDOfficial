import EmailHistory from "@/components/admin/emails/EmailHistory";
export default function Page() {
  return (
    <div className="portal-page">
      <EmailHistory endpoint="/api/partner-portal/emails" organizationOnly />
    </div>
  );
}
