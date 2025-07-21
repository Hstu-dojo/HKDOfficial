import { VerifyMail } from '@/components/component/verify-mail';
import React from 'react';

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

const VerifyYourMail = async ({ searchParams }: PageProps) => {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl;
  return (
    <div>
      <VerifyMail callbackUrl={callbackUrl} />
    </div>
  );
};

export default VerifyYourMail;