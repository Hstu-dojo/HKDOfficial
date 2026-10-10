'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSessionCompat';
import { useRouter } from 'next/navigation';
import { registerForProgram } from '@/actions/program-actions';
import { CldUploadWidget } from 'next-cloudinary';
import { format } from 'date-fns';
import {
  CalendarIcon,
  MapPinIcon,
  CurrencyBangladeshiIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';

interface ProgramDetailsProps {
  slug: string;
  initialProgram: any;
}

export default function ProgramDetails({ slug, initialProgram }: ProgramDetailsProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [program] = useState<any>(initialProgram);

  // Registration State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  // Belt test specific
  const [newRank, setNewRank] = useState<string>('');

  const BELT_RANKS = [
    { value: 'white', label: 'White Belt' },
    { value: 'yellow', label: 'Yellow Belt' },
    { value: 'orange', label: 'Orange Belt' },
    { value: 'green', label: 'Green Belt' },
    { value: 'blue', label: 'Blue Belt' },
    { value: 'purple', label: 'Purple Belt' },
    { value: 'brown_kyu3', label: 'Brown Belt (Kyu 3)' },
    { value: 'brown_kyu2', label: 'Brown Belt (Kyu 2)' },
    { value: 'brown_kyu1', label: 'Brown Belt (Kyu 1)' },
    { value: 'black', label: 'Black Belt' },
  ];

  // Payment Account State
  const [paymentAccount, setPaymentAccount] = useState<{
    name: string;
    methodType: string;
    accountNumber: string;
    accountName?: string | null;
    instructions?: string | null;
  } | null>(null);

  // Fetch payment account only (program data is pre-fetched server-side)
  useEffect(() => {
    async function fetchPaymentAccount() {
      if (!program?.id) return;
      try {
        const paymentRes = await fetch(`/api/payment-accounts?scope=program&scopeId=${program.id}`);
        if (paymentRes.ok) {
          const paymentData = await paymentRes.json();
          if (paymentData.primaryAccount) {
            setPaymentAccount(paymentData.primaryAccount);
          }
        }
      } catch (error) {
        console.error('Error fetching payment account:', error);
      }
    }
    fetchPaymentAccount();
  }, [program?.id]);

  const handleRegisterClick = () => {
    if (status === 'unauthenticated') {
      router.push(`/login?callbackUrl=/karate/programs/${slug}`);
      return;
    }
    setShowRegisterModal(true);
  };

  const handleUploadSuccess = (result: any) => {
     if (result?.info && typeof result.info !== "string") {
        setPaymentProofUrl(result.info.secure_url);
        toast.success("Proof uploaded!");
     }
  };

  const submitRegistration = async () => {
    if (!program || !session?.user) return;
    if (!transactionId) {
      toast.error('Please enter transaction ID');
      return;
    }

    if (program?.type === 'BELT_TEST' && !newRank) {
      toast.error('Please select your new rank');
      return;
    }
    // Only require proof if you want to. Let's make it optional but recommended.

    setSubmitting(true);
    setRegistrationError('');

    try {
      const res = await registerForProgram({
         programId: program.id,
         userId: session.user.id,
         feeAmount: program.fee,
         transactionId: transactionId,
         paymentProofUrl: paymentProofUrl || null,
         status: 'pending_payment', // Default
         paymentMethod: paymentAccount?.methodType || 'bkash', // Use selected payment method
        newRank: program?.type === 'BELT_TEST' ? (newRank as any) : null,
      });

      if (res.success) {
        toast.success('Registration submitted successfully! Redirecting to dashboard...');
        setShowRegisterModal(false);
        // Redirect to dashboard to see registration status
        router.push('/dashboard');
      } else {
        setRegistrationError(res.error || 'Failed to register');
        toast.error(res.error || 'Failed to register');
      }
    } catch (error) {
      console.error(error);
      setRegistrationError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const isRegistrationOpen = program.isRegistrationOpen &&
    (!program.registrationDeadline || new Date(program.registrationDeadline) > new Date());

  const isFull = program.maxParticipants && (program.currentParticipants || 0) >= program.maxParticipants;

  return (
    <div className="py-8 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="bg-white dark:bg-card rounded-2xl shadow-lg overflow-hidden border border-border dark:border-border">
           {/* Banner */}
           <div className="relative flex min-h-56 w-full flex-col justify-end overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70"></div>
              <div className="absolute inset-0 bg-[url('/hero/pattern.svg')] opacity-10"></div>
              <div className="relative p-6 text-primary-foreground sm:p-8">
                 <span className="inline-flex max-w-full rounded-full bg-primary-foreground/20 px-3 py-1.5 text-xs font-semibold uppercase leading-5 tracking-wide text-primary-foreground backdrop-blur-sm">
                   {program.type.replace('_', ' ')}
                 </span>
                 <h1 className="mt-4 break-words text-3xl font-bold text-primary-foreground md:text-4xl">{program.title}</h1>
              </div>
           </div>

           <div className="p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Main Content */}
                 <div className="lg:col-span-2 space-y-6">
                    <div className="prose prose-slate dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap text-muted-foreground dark:text-muted-foreground leading-relaxed">{program.description}</p>
                    </div>

                    <div className="border-t border-border dark:border-border pt-6">
                       <h3 className="font-semibold text-foreground dark:text-foreground mb-4">Schedule & Location</h3>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3 p-4 rounded-xl bg-muted dark:bg-background/50">
                             <CalendarIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                             <div>
                               <p className="font-medium text-foreground dark:text-foreground">Starts</p>
                               <p className="text-sm text-muted-foreground dark:text-muted-foreground">{format(new Date(program.startDate), 'PPP p')}</p>
                             </div>
                          </div>
                          {program.endDate && (
                             <div className="flex items-start gap-3 p-4 rounded-xl bg-muted dark:bg-background/50">
                               <CalendarIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                               <div>
                                 <p className="font-medium text-foreground dark:text-foreground">Ends</p>
                                 <p className="text-sm text-muted-foreground dark:text-muted-foreground">{format(new Date(program.endDate), 'PPP p')}</p>
                               </div>
                            </div>
                          )}
                          {program.location && (
                             <div className="flex items-start gap-3 p-4 rounded-xl bg-muted dark:bg-background/50 sm:col-span-2">
                               <MapPinIcon className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                               <div>
                                 <p className="font-medium text-foreground dark:text-foreground">Location</p>
                                 <p className="text-sm text-muted-foreground dark:text-muted-foreground">{program.location}</p>
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Sidebar / Actions */}
                 <div className="lg:col-span-1">
                    <div className="sticky top-24 bg-muted dark:bg-background/50 rounded-xl p-6 border border-border dark:border-border">
                       <h3 className="text-lg font-semibold text-foreground dark:text-foreground">Registration</h3>

                       <div className="mt-4 space-y-3">
                          <div className="flex justify-between items-center">
                             <span className="text-muted-foreground dark:text-muted-foreground">Fee</span>
                             <span className="font-bold text-foreground dark:text-foreground text-xl">৳{program.fee}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-muted-foreground dark:text-muted-foreground">Status</span>
                             {isRegistrationOpen && !isFull ? (
                               <span className="text-green-600 dark:text-green-400 font-medium flex items-center gap-1">
                                 <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                 Open
                               </span>
                             ) : (
                               <span className="text-red-600 dark:text-red-400 font-medium">Closed</span>
                             )}
                          </div>
                          {program.maxParticipants && (
                             <div className="flex justify-between items-center">
                               <span className="text-muted-foreground dark:text-muted-foreground">Seats</span>
                               <span className="text-foreground dark:text-foreground">{(program.currentParticipants || 0)} / {program.maxParticipants}</span>
                             </div>
                          )}
                       </div>

                       <div className="mt-6">
                          {isRegistrationOpen && !isFull ? (
                             <button
                               onClick={handleRegisterClick}
                               className="w-full bg-primary text-white rounded-xl py-3 px-4 font-semibold hover:opacity-90 transition shadow-sm"
                             >
                               Register Now
                             </button>
                          ) : (
                             <button disabled className="w-full bg-slate-300 dark:bg-slate-600 text-muted-foreground dark:text-muted-foreground rounded-xl py-3 px-4 font-semibold cursor-not-allowed">
                               Registration Closed
                             </button>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
             <div className="fixed inset-0 transition-opacity" onClick={() => setShowRegisterModal(false)}>
               <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
             </div>

             <div className="inline-block align-bottom bg-white dark:bg-card rounded-2xl text-left overflow-hidden shadow-sm transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-border dark:border-border">
                <div className="px-6 pt-6 pb-6">
                   <h3 className="text-xl font-bold text-foreground dark:text-foreground" id="modal-title">
                     Register for {program.title}
                   </h3>
                   <div className="mt-4">
                      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 mb-4">
                        <p className="text-sm text-foreground dark:text-muted-foreground">
                          Please send <span className="font-bold text-primary">৳{program.fee}</span> to our {paymentAccount?.methodType?.toUpperCase() || 'Nagad'} Number:
                        </p>
                        <p className="text-2xl font-mono font-bold text-primary mt-1">
                          {paymentAccount?.accountNumber || '01777-300309'}
                        </p>
                        {paymentAccount?.accountName && (
                          <p className="text-sm text-muted-foreground dark:text-muted-foreground mt-1">
                            Account: {paymentAccount.accountName}
                          </p>
                        )}
                        {paymentAccount?.instructions && (
                          <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                            {paymentAccount.instructions}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground dark:text-muted-foreground mt-2">
                          Use Reference: <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded">{session?.user?.name?.split(' ')[0]}-{program.id.substring(0,4)}</code>
                        </p>
                      </div>

                      {registrationError && (
                         <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4 text-red-700 dark:text-red-300 text-sm">
                           {registrationError}
                         </div>
                      )}

                      <form onSubmit={(e) => { e.preventDefault(); submitRegistration(); }} className="space-y-4">
                         {program?.type === 'BELT_TEST' && (
                           <div>
                             <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-1">New Rank</label>
                             <select
                               required
                               value={newRank}
                               onChange={(e) => setNewRank(e.target.value)}
                               className="w-full border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-3 bg-white dark:bg-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                             >
                               <option value="">Select new rank</option>
                               {BELT_RANKS.map((belt) => (
                                 <option key={belt.value} value={belt.value}>
                                   {belt.label}
                                 </option>
                               ))}
                             </select>
                           </div>
                         )}
                         <div>
                            <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-1">Transaction ID</label>
                            <input
                              type="text"
                              required
                              value={transactionId}
                              onChange={e => setTransactionId(e.target.value)}
                              placeholder="e.g. 9JKS82..."
                              className="w-full border border-slate-300 dark:border-slate-600 rounded-lg py-2.5 px-3 bg-white dark:bg-background text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                            />
                         </div>

                         <div>
                            <label className="block text-sm font-medium text-foreground dark:text-muted-foreground mb-2">Payment Proof (Optional)</label>
                            {paymentProofUrl ? (
                               <div className="flex items-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
                                 <CheckCircleIcon className="h-5 w-5" />
                                 <span className="text-sm font-medium">Proof Uploaded</span>
                               </div>
                            ) : (
                              <CldUploadWidget
                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "yddebkab"}
                                onSuccess={handleUploadSuccess}
                                options={{
                                    sources: ['local', 'url'],
                                    maxFiles: 1,
                                    resourceType: 'image'
                                }}
                              >
                                {({ open }) => (
                                  <button
                                    type="button"
                                    className="inline-flex items-center px-4 py-2.5 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-lg text-foreground dark:text-foreground bg-white dark:bg-background hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                    onClick={() => open()}
                                  >
                                    <PhotoIcon className="-ml-1 mr-2 h-5 w-5 text-slate-400" />
                                    Upload Screenshot
                                  </button>
                                )}
                              </CldUploadWidget>
                            )}
                         </div>

                         <div className="pt-4 flex flex-col-reverse sm:flex-row gap-3">
                            <button
                              type="button"
                              onClick={() => setShowRegisterModal(false)}
                              className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 dark:border-slate-600 text-foreground dark:text-foreground font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={submitting}
                              className="flex-1 py-2.5 px-4 rounded-lg bg-primary text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                              {submitting ? 'Submitting...' : 'Confirm Registration'}
                            </button>
                          </div>
                      </form>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
