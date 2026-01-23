"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSessionCompat";
import { checkUserProfileStatus } from "@/actions/check-profile";
import { XMarkIcon } from "@heroicons/react/24/outline";

export function OnboardingAlert() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
        if (session?.user?.id) {
            try {
                const status = await checkUserProfileStatus(session.user.id);
                if (!status.isComplete) {
                    setShow(true);
                } else {
                    setShow(false);
                }
            } catch (error) {
                console.error("Failed to check profile status", error);
            }
        }
        setLoading(false);
    };

    if (session?.user?.id) {
        checkStatus();
    } else if (session === null) {
      // Session finished loading and no user
      setLoading(false);
    }
  }, [session]);

  if (!show || loading) return null;

  return (
    <div className="bg-yellow-500 text-black px-4 py-3 relative z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex-1 text-center font-medium text-sm md:text-base">
            Your profile is incomplete. Please <Link href="/onboarding" className="underline font-bold hover:text-white transition-colors">complete your profile</Link> to access programs and courses.
        </div>
        <button onClick={() => setShow(false)} className="ml-4 p-1 hover:bg-yellow-600 rounded transition-colors" aria-label="Close alert">
            <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
