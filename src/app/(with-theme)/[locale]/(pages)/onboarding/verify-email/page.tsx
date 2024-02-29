import { VerifyMail } from '@/components/component/verify-mail';
import React from 'react';

const VerifyYourMail = ({ searchParams }: any) => {
  const callbackUrl = searchParams?.callbackUrl;
  return (
    <div>
      <VerifyMail callbackUrl={callbackUrl} />
    </div>
  );
};

export default VerifyYourMail;