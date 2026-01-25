"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSessionCompat";
import { getOnboardingStatus } from "@/actions/onboarding-actions";
import { XMarkIcon, UserCircleIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

export function OnboardingAlert() {
  const { data: session, status: sessionStatus } = useSession();
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

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

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShow(false);
    setDismissed(true);
    sessionStorage.setItem('onboarding-alert-dismissed', 'true');
  };

  if (!show || loading || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-500">
      <Link 
        href="/onboarding"
        className="block"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn(
          "relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-300",
          "bg-gradient-to-br from-amber-50 via-white to-orange-50",
          "dark:from-slate-800 dark:via-slate-900 dark:to-slate-800",
          "border border-amber-200/50 dark:border-amber-500/20",
          isHovered ? "scale-[1.02] shadow-amber-500/20 dark:shadow-amber-500/10" : ""
        )}>
          {/* Decorative gradient blob */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-400/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-tr from-yellow-400/15 to-amber-400/15 dark:from-yellow-500/5 dark:to-amber-500/5 rounded-full blur-xl" />
          
          <div className="relative p-4">
            {/* Close button */}
            <button 
              onClick={handleDismiss} 
              className={cn(
                "absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200",
                "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
                "hover:bg-slate-100 dark:hover:bg-slate-700/50"
              )}
              aria-label="Dismiss notification"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-6">
              {/* Icon */}
              <div className={cn(
                "flex-shrink-0 p-2.5 rounded-xl",
                "bg-gradient-to-br from-amber-400 to-orange-500",
                "shadow-lg shadow-amber-500/30 dark:shadow-amber-500/20"
              )}>
                <UserCircleIcon className="h-6 w-6 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-0.5">
                  Complete Your Profile
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Finish your membership registration to unlock all programs and courses.
                </p>

                {/* CTA */}
                <div className={cn(
                  "mt-3 inline-flex items-center gap-1.5 text-xs font-semibold",
                  "text-amber-600 dark:text-amber-400",
                  "transition-all duration-200",
                  isHovered ? "gap-2.5" : ""
                )}>
                  <span>Complete Now</span>
                  <ArrowRightIcon className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    isHovered ? "translate-x-1" : ""
                  )} />
                </div>
              </div>
            </div>

            {/* Progress indicator line */}
            <div className="mt-3 h-1 rounded-full bg-slate-200/50 dark:bg-slate-700/50 overflow-hidden">
              <div className="h-full w-1/4 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 animate-pulse" />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
