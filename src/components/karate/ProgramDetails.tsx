'use client';

import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSessionCompat';
import { useRouter } from 'next/navigation';
import { getProgramBySlug, registerForProgram } from '@/actions/program-actions';
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
}

export default function ProgramDetails({ slug }: ProgramDetailsProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [program, setProgram] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Registration State
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [registrationError, setRegistrationError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getProgramBySlug(slug);
        if (res.success && res.data) {
          setProgram(res.data);
        } else {
          toast.error("Program not found");
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

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
         paymentMethod: 'bkash', // Assuming default for now
      });

      if (res.success) {
        toast.success('Registration submitted successfully! Wait for approval.');
        setShowRegisterModal(false);
        // Refresh or show success state
        router.push('/karate/programs'); // or stay and show status
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

  if (loading) return <div className="p-12 text-center">Loading program...</div>;
  if (!program) return <div className="p-12 text-center">Program not found.</div>;

  const isRegistrationOpen = program.isRegistrationOpen && 
    (!program.registrationDeadline || new Date(program.registrationDeadline) > new Date());
  
  const isFull = program.maxParticipants && (program.currentParticipants || 0) >= program.maxParticipants;

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border">
           {/* Banner */}
           <div className="h-48 bg-gray-200 w-full relative">
              {/* If bannerUrl exists, show it. Otherwise pattern/color */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-90"></div>
              <div className="absolute bottom-0 left-0 p-8 text-white">
                 <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                   {program.type.replace('_', ' ')}
                 </span>
                 <h1 className="mt-4 text-3xl font-bold">{program.title}</h1>
              </div>
           </div>

           <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {/* Main Content */}
                 <div className="md:col-span-2 space-y-6">
                    <div className="prose max-w-none text-gray-600">
                      <p className="whitespace-pre-wrap">{program.description}</p>
                    </div>

                    <div className="border-t pt-6">
                       <h3 className="font-semibold text-gray-900 mb-4">Schedule</h3>
                       <div className="space-y-3">
                          <div className="flex items-center text-gray-600">
                             <CalendarIcon className="h-5 w-5 mr-3 text-gray-400" />
                             <div>
                               <p className="font-medium">Starts</p>
                               <p className="text-sm">{format(new Date(program.startDate), 'PPP p')}</p>
                             </div>
                          </div>
                          {program.endDate && (
                             <div className="flex items-center text-gray-600">
                               <CalendarIcon className="h-5 w-5 mr-3 text-gray-400" />
                               <div>
                                 <p className="font-medium">Ends</p>
                                 <p className="text-sm">{format(new Date(program.endDate), 'PPP p')}</p>
                               </div>
                            </div>
                          )}
                          {program.location && (
                             <div className="flex items-center text-gray-600">
                               <MapPinIcon className="h-5 w-5 mr-3 text-gray-400" />
                               <div>
                                 <p className="font-medium">Location</p>
                                 <p className="text-sm">{program.location}</p>
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* Sidebar / Actions */}
                 <div className="md:col-span-1 space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6 border">
                       <h3 className="text-lg font-semibold text-gray-900">Registration</h3>
                       
                       <div className="mt-4 space-y-2">
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-gray-500">Fee</span>
                             <span className="font-bold text-gray-900 text-lg">৳{program.fee}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-gray-500">Status</span>
                             {isRegistrationOpen && !isFull ? (
                               <span className="text-green-600 font-medium">Open</span>
                             ) : (
                               <span className="text-red-600 font-medium">Closed</span>
                             )}
                          </div>
                          {program.maxParticipants && (
                             <div className="flex justify-between items-center text-sm">
                               <span className="text-gray-500">Capacity</span>
                               <span>{(program.currentParticipants || 0)} / {program.maxParticipants}</span>
                             </div>
                          )}
                       </div>

                       <div className="mt-6">
                          {isRegistrationOpen && !isFull ? (
                             <button
                               onClick={handleRegisterClick}
                               className="w-full bg-blue-600 text-white rounded-lg py-3 px-4 font-semibold hover:bg-blue-700 transition shadow-sm"
                             >
                               Register Now
                             </button>
                          ) : (
                             <button disabled className="w-full bg-gray-300 text-gray-500 rounded-lg py-3 px-4 font-semibold cursor-not-allowed">
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
               <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
             </div>

             <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                   <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                     Register for {program.title}
                   </h3>
                   <div className="mt-4">
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <ExclamationCircleIcon className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              Please send <span className="font-bold">৳{program.fee}</span> to our Bkash Merchant Number: 
                              <br/><span className="text-lg font-mono font-bold">017XXXXXXXX</span>
                              <br/>Use Reference: <span className="font-mono">{session?.user?.name?.split(' ')[0]}-{program.id.substring(0,4)}</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {registrationError && (
                         <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 text-red-700 text-sm">
                           {registrationError}
                         </div>
                      )}

                      <form onSubmit={(e) => { e.preventDefault(); submitRegistration(); }} className="space-y-4">
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                            <input 
                              type="text" 
                              required 
                              value={transactionId}
                              onChange={e => setTransactionId(e.target.value)}
                              placeholder="e.g. 9JKS82..."
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" 
                            />
                         </div>

                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Proof (Optional)</label>
                            {paymentProofUrl ? (
                               <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-2 rounded">
                                 <CheckCircleIcon className="h-5 w-5" />
                                 <span className="text-sm">Proof Uploaded</span>
                               </div>
                            ) : (
                              <CldUploadWidget 
                                uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "gallery_uploads"}
                                onSuccess={handleUploadSuccess}
                              >
                                {({ open }) => (
                                  <button 
                                    type="button" 
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    onClick={() => open()}
                                  >
                                    <PhotoIcon className="-ml-1 mr-2 h-5 w-5 text-gray-400" />
                                    Upload Screenshot
                                  </button>
                                )}
                              </CldUploadWidget>
                            )}
                         </div>

                         <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm disabled:opacity-50"
                            >
                              {submitting ? 'Submitting...' : 'Confirm Registration'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowRegisterModal(false)}
                              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                            >
                              Cancel
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
