'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSessionCompat';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeftIcon,
  BanknotesIcon,
  CheckCircleIcon,
  CalendarIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface FeeDetails {
  id: string;
  billingMonth: string;
  feeAmount: number;
  discountAmount: number;
  lateFeePenalty: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  dueDate: string;
  status: string;
  courseName: string;
  bkashNumber?: string;
  bkashQrCodeUrl?: string;
  nagadNumber?: string;
  rocketNumber?: string;
}

export default function PayFeeForm({ feeId }: { feeId: string }) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [paymentInfo, setPaymentInfo] = useState({
    paymentMethod: 'bkash',
    transactionId: '',
    paymentProofUrl: '',
  });

  useEffect(() => {
    const fetchFeeDetails = async () => {
      if (authStatus !== 'authenticated') return;

      try {
        const response = await fetch(`/api/student/monthly-fees/${feeId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Fee not found');
            router.push('/dashboard/enrollments');
            return;
          }
          throw new Error('Failed to fetch fee details');
        }
        const data = await response.json();
        setFeeDetails(data);
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load fee details');
      } finally {
        setLoading(false);
      }
    };

    fetchFeeDetails();
  }, [feeId, authStatus, router]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-BD', { year: 'numeric', month: 'long' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSubmitPayment = async () => {
    if (!paymentInfo.transactionId) {
      toast.error('Please enter the transaction ID');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/student/monthly-fees/${feeId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentInfo),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Payment submission failed');
      }

      toast.success('Payment submitted for verification!');
      router.push('/dashboard/enrollments');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Payment submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!feeDetails) {
    return null;
  }

  if (!['pending', 'due', 'overdue'].includes(feeDetails.status)) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <CheckCircleIcon className="h-16 w-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {feeDetails.status === 'paid' ? 'Fee Already Paid' : 'Fee Status: ' + feeDetails.status}
        </h2>
        <Link href="/dashboard/enrollments" className="text-red-600 hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const amountDue = feeDetails.totalAmount - feeDetails.paidAmount;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/enrollments"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Pay Monthly Fee</h1>
      </div>

      {/* Fee Summary */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-red-100 rounded-lg">
            <AcademicCapIcon className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{feeDetails.courseName}</h2>
            <p className="text-gray-500">{formatMonth(feeDetails.billingMonth)}</p>
          </div>
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Monthly Fee</span>
            <span>{formatCurrency(feeDetails.feeAmount, feeDetails.currency)}</span>
          </div>
          {feeDetails.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(feeDetails.discountAmount, feeDetails.currency)}</span>
            </div>
          )}
          {feeDetails.lateFeePenalty > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>Late Fee</span>
              <span>+{formatCurrency(feeDetails.lateFeePenalty, feeDetails.currency)}</span>
            </div>
          )}
          {feeDetails.paidAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Already Paid</span>
              <span>-{formatCurrency(feeDetails.paidAmount, feeDetails.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>Amount Due</span>
            <span className="text-red-600">{formatCurrency(amountDue, feeDetails.currency)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>Due by: {formatDate(feeDetails.dueDate)}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Select Payment Method</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {feeDetails.bkashNumber && (
            <button
              type="button"
              onClick={() => setPaymentInfo(p => ({ ...p, paymentMethod: 'bkash' }))}
              className={`p-4 border-2 rounded-lg text-center ${
                paymentInfo.paymentMethod === 'bkash'
                  ? 'border-pink-500 bg-pink-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🔴</div>
              <div className="font-medium">bKash</div>
            </button>
          )}
          {feeDetails.nagadNumber && (
            <button
              type="button"
              onClick={() => setPaymentInfo(p => ({ ...p, paymentMethod: 'nagad' }))}
              className={`p-4 border-2 rounded-lg text-center ${
                paymentInfo.paymentMethod === 'nagad'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🟠</div>
              <div className="font-medium">Nagad</div>
            </button>
          )}
          {feeDetails.rocketNumber && (
            <button
              type="button"
              onClick={() => setPaymentInfo(p => ({ ...p, paymentMethod: 'rocket' }))}
              className={`p-4 border-2 rounded-lg text-center ${
                paymentInfo.paymentMethod === 'rocket'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1">🟣</div>
              <div className="font-medium">Rocket</div>
            </button>
          )}
        </div>

        {/* bKash Instructions */}
        {paymentInfo.paymentMethod === 'bkash' && feeDetails.bkashNumber && (
          <div className="bg-pink-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-pink-900 mb-3">bKash Payment Instructions</h4>
            <ol className="list-decimal list-inside text-sm text-pink-800 space-y-2">
              <li>Open bKash App</li>
              <li>Go to &quot;Send Money&quot;</li>
              <li>Enter number: <span className="font-mono font-bold">{feeDetails.bkashNumber}</span></li>
              <li>Enter amount: {formatCurrency(amountDue, feeDetails.currency)}</li>
              <li>Add reference: {formatMonth(feeDetails.billingMonth)} Fee</li>
              <li>Complete the payment and note the Transaction ID</li>
            </ol>
            
            {feeDetails.bkashQrCodeUrl && (
              <div className="mt-4">
                <p className="text-sm text-pink-800 mb-2">Or scan QR code:</p>
                <div className="bg-white p-3 rounded-lg inline-block">
                  <Image
                    src={feeDetails.bkashQrCodeUrl}
                    alt="bKash QR"
                    width={150}
                    height={150}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Details Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction ID *
            </label>
            <input
              type="text"
              value={paymentInfo.transactionId}
              onChange={(e) => setPaymentInfo(p => ({ ...p, transactionId: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
              placeholder="Enter transaction ID"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Screenshot URL
            </label>
            <input
              type="url"
              value={paymentInfo.paymentProofUrl}
              onChange={(e) => setPaymentInfo(p => ({ ...p, paymentProofUrl: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder="https://imgur.com/..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Upload screenshot to imgur.com and paste the link here
            </p>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmitPayment}
        disabled={submitting || !paymentInfo.transactionId}
        className="w-full py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            Submitting...
          </>
        ) : (
          <>
            <BanknotesIcon className="h-5 w-5" />
            Submit Payment
          </>
        )}
      </button>
    </div>
  );
}
