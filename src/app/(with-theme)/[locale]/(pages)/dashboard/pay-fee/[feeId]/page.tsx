import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PayFeeForm from '@/components/student/PayFeeForm';

interface PageProps {
  params: Promise<{
    locale: string;
    feeId: string;
  }>;
}

export const metadata: Metadata = {
  title: 'Pay Monthly Fee | Dashboard',
  description: 'Pay your monthly karate class fee',
};

export default async function PayFeePage({ params }: PageProps) {
  const { feeId } = await params;
  
  return <PayFeeForm feeId={feeId} />;
}
