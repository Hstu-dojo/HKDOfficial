'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSessionCompat';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrentLocale, useI18n } from '@/locales/client';
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
  courseId?: string;
  bkashNumber?: string;
  bkashQrCodeUrl?: string;
  nagadNumber?: string;
  rocketNumber?: string;
}

interface PaymentAccountInfo {
  id: string;
  name: string;
  methodType: string;
  accountNumber: string;
  accountName?: string;
  qrCodeUrl?: string;
  instructions?: string;
}

export default function PayFeeForm({ feeId }: { feeId: string }) {
  const t = useI18n();
  const locale = useCurrentLocale();
  const intlLocale = locale === 'bn' ? 'bn-BD' : locale === 'ne' ? 'ne-NP' : 'en-BD';

  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccountInfo[]>([]);
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
            toast.error(t('feePayment.feeNotFound'));
            router.push('/dashboard/enrollments');
            return;
          }
          throw new Error('Failed to fetch fee details');
        }
        const data = await response.json();
        setFeeDetails(data);
        
        // Fetch payment accounts for this course's organization
        if (data.courseId) {
          try {
            const accountsRes = await fetch(`/api/student/payment-accounts?courseId=${data.courseId}`);
            if (accountsRes.ok) {
              const accountsData = await accountsRes.json();
              setPaymentAccounts(accountsData.accounts || []);
              // Auto-select first account's method
              if (accountsData.accounts?.length > 0) {
                setPaymentInfo(p => ({ ...p, paymentMethod: accountsData.accounts[0].methodType }));
              }
            }
          } catch {
            // Fallback to course-level payment info
          }
        }
      } catch (error) {
        console.error('Error:', error);
        toast.error(t('feePayment.failedToLoadFeeDetails'));
      } finally {
        setLoading(false);
      }
    };

    fetchFeeDetails();
  }, [feeId, authStatus, router, t]);

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat(intlLocale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString(intlLocale, { year: 'numeric', month: 'long' });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(intlLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleSubmitPayment = async () => {
    if (!paymentInfo.transactionId) {
      toast.error(t('feePayment.pleaseEnterTransactionId'));
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

      toast.success(t('feePayment.paymentSubmitted'));
      router.push('/dashboard/enrollments');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t('feePayment.paymentSubmissionFailed'),
      );
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
          {feeDetails.status === 'paid'
            ? t('feePayment.feeAlreadyPaid')
            : t('feePayment.feeStatus', { status: feeDetails.status })}
        </h2>
        <Link href="/dashboard/enrollments" className="text-red-600 hover:underline">
          {t('feePayment.backToDashboard')}
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
          {t('feePayment.backToDashboard')}
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{t('feePayment.payMonthlyFee')}</h1>
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
            <span className="text-gray-500">{t('feePayment.monthlyFee')}</span>
            <span>{formatCurrency(feeDetails.feeAmount, feeDetails.currency)}</span>
          </div>
          {feeDetails.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t('feePayment.discount')}</span>
              <span>-{formatCurrency(feeDetails.discountAmount, feeDetails.currency)}</span>
            </div>
          )}
          {feeDetails.lateFeePenalty > 0 && (
            <div className="flex justify-between text-sm text-red-600">
              <span>{t('feePayment.lateFee')}</span>
              <span>+{formatCurrency(feeDetails.lateFeePenalty, feeDetails.currency)}</span>
            </div>
          )}
          {feeDetails.paidAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>{t('feePayment.alreadyPaid')}</span>
              <span>-{formatCurrency(feeDetails.paidAmount, feeDetails.currency)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-lg pt-2 border-t">
            <span>{t('feePayment.amountDue')}</span>
            <span className="text-red-600">{formatCurrency(amountDue, feeDetails.currency)}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4" />
          <span>{t('feePayment.dueBy', { date: formatDate(feeDetails.dueDate) })}</span>
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="bg-white rounded-lg border p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">{t('feePayment.selectPaymentMethod')}</h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          {/* Dynamic payment accounts from API */}
          {paymentAccounts.length > 0 ? (
            paymentAccounts.map((account) => {
              const methodColors: Record<string, { active: string; inactive: string; emoji: string }> = {
                bkash: { active: 'border-pink-500 bg-pink-50', inactive: 'border-gray-200 hover:border-gray-300', emoji: '🔴' },
                nagad: { active: 'border-orange-500 bg-orange-50', inactive: 'border-gray-200 hover:border-gray-300', emoji: '🟠' },
                rocket: { active: 'border-purple-500 bg-purple-50', inactive: 'border-gray-200 hover:border-gray-300', emoji: '🟣' },
                upay: { active: 'border-green-500 bg-green-50', inactive: 'border-gray-200 hover:border-gray-300', emoji: '🟢' },
                bank_transfer: { active: 'border-blue-500 bg-blue-50', inactive: 'border-gray-200 hover:border-gray-300', emoji: '🏦' },
                cash: { active: 'border-gray-500 bg-gray-50', inactive: 'border-gray-200 hover:border-gray-300', emoji: '💵' },
              }
              const colors = methodColors[account.methodType] || methodColors.cash
              const isSelected = paymentInfo.paymentMethod === account.methodType
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => setPaymentInfo(p => ({ ...p, paymentMethod: account.methodType }))}
                  className={`p-4 border-2 rounded-lg text-center ${isSelected ? colors.active : colors.inactive}`}
                >
                  <div className="text-2xl mb-1">{colors.emoji}</div>
                  <div className="font-medium">{account.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{account.accountNumber}</div>
                </button>
              )
            })
          ) : (
            /* Fallback to course-level payment info */
            <>
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
            </>
          )}
        </div>

        {/* Dynamic Payment Instructions */}
        {paymentAccounts.length > 0 ? (
          (() => {
            const selectedAccount = paymentAccounts.find(a => a.methodType === paymentInfo.paymentMethod);
            if (!selectedAccount) return null;
            return (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-3">
                  {t('feePayment.bkashInstructionsTitle').replace('bKash', selectedAccount.name)}
                </h4>
                <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
                  <li>Open your {selectedAccount.methodType} app</li>
                  <li>Go to &quot;Send Money&quot;</li>
                  <li>
                    Send to: <span className="font-mono font-bold">{selectedAccount.accountNumber}</span>
                    {selectedAccount.accountName && (
                      <span className="text-xs"> ({selectedAccount.accountName})</span>
                    )}
                  </li>
                  <li>
                    Amount: {formatCurrency(amountDue, feeDetails.currency)}
                  </li>
                  <li>Add reference: {formatMonth(feeDetails.billingMonth)} fee</li>
                  <li>Complete the payment and note the Transaction ID</li>
                </ol>
                {selectedAccount.instructions && (
                  <p className="mt-3 text-sm text-blue-700">{selectedAccount.instructions}</p>
                )}
                {selectedAccount.qrCodeUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-blue-800 mb-2">{t('feePayment.orScanQr')}</p>
                    <div className="bg-white p-3 rounded-lg inline-block">
                      <Image
                        src={selectedAccount.qrCodeUrl}
                        alt="Payment QR"
                        width={150}
                        height={150}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        ) : (
          /* Fallback: original bKash instructions */
          paymentInfo.paymentMethod === 'bkash' && feeDetails.bkashNumber && (
            <div className="bg-pink-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-pink-900 mb-3">{t('feePayment.bkashInstructionsTitle')}</h4>
              <ol className="list-decimal list-inside text-sm text-pink-800 space-y-2">
                <li>{t('feePayment.bkashSteps.openApp')}</li>
                <li>{t('feePayment.bkashSteps.goToSendMoney')}</li>
                <li>
                  {t('feePayment.bkashSteps.enterNumberLabel')}{' '}
                  <span className="font-mono font-bold">{feeDetails.bkashNumber}</span>
                </li>
                <li>
                  {t('feePayment.bkashSteps.enterAmountLabel')}{' '}
                  {formatCurrency(amountDue, feeDetails.currency)}
                </li>
                <li>
                  {t('feePayment.bkashSteps.addReferenceLabel')}{' '}
                  {formatMonth(feeDetails.billingMonth)} {t('feePayment.bkashSteps.referenceSuffix')}
                </li>
                <li>{t('feePayment.bkashSteps.completePayment')}</li>
              </ol>
              
              {feeDetails.bkashQrCodeUrl && (
                <div className="mt-4">
                  <p className="text-sm text-pink-800 mb-2">{t('feePayment.orScanQr')}</p>
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
          )
        )}

        {/* Payment Details Input */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('feePayment.transactionIdLabel')} *
            </label>
            <input
              type="text"
              value={paymentInfo.transactionId}
              onChange={(e) => setPaymentInfo(p => ({ ...p, transactionId: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 font-mono"
              placeholder={t('feePayment.transactionIdPlaceholder')}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('feePayment.paymentScreenshotUrlLabel')}
            </label>
            <input
              type="url"
              value={paymentInfo.paymentProofUrl}
              onChange={(e) => setPaymentInfo(p => ({ ...p, paymentProofUrl: e.target.value }))}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500"
              placeholder={t('feePayment.paymentScreenshotUrlPlaceholder')}
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('feePayment.paymentScreenshotUrlHint')}
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
            {t('feePayment.submitting')}
          </>
        ) : (
          <>
            <BanknotesIcon className="h-5 w-5" />
            {t('feePayment.submitPayment')}
          </>
        )}
      </button>
    </div>
  );
}
