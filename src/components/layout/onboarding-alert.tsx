"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSessionCompat";
import { getOnboardingStatus } from "@/actions/onboarding-actions";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function OnboardingAlert() {
  const { data: session, status: sessionStatus } = useSession();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed the alert this session
    const wasDismissed = sessionStorage.getItem('onboarding-alert-dismissed');
    if (wasDismissed === 'true') {
      setDismissed(true);
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      if (session?.user) {
        try {
          // Use the same function the onboarding page uses
          const result = await getOnboardingStatus();
          // Only show alert if user has NOT completed onboarding
          if (!result.existing) {
            setShow(true);
          } else {
            setShow(false);
          }
        } catch (error) {
          console.error("Failed to check profile status", error);
          setShow(false);
        }
      }
      setLoading(false);
    };

    if (sessionStatus === 'authenticated' && session?.user) {
      checkStatus();
    } else if (sessionStatus === 'unauthenticated') {
      setLoading(false);
      setShow(false);
    }
  }, [session, sessionStatus]);

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('onboarding-alert-dismissed', 'true');
  };

  if (!show || loading || dismissed) return null;

  return (
    <div className="bg-yellow-500 text-black px-4 py-3 relative z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1 text-center font-medium text-sm md:text-base">
            Please <Link href="/onboarding" className="underline font-bold hover:text-white transition-colors">complete your membership registration</Link> to access all programs and courses.
        </div>
        <button onClick={handleDismiss} className="ml-4 p-1 hover:bg-yellow-600 rounded transition-colors" aria-label="Close alert">
            <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
