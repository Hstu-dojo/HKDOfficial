"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "@/hooks/useSessionCompat";
import { getOnboardingStatus } from "@/actions/onboarding-actions";
import { UserCircleIcon, ArrowRightIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface ProfileCompletionBannerProps {
  variant?: "inline" | "card" | "minimal";
  className?: string;
}

export function ProfileCompletionBanner({ 
  variant = "inline",
  className 
}: ProfileCompletionBannerProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [showBanner, setShowBanner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      if (session?.user) {
        try {
          const result = await getOnboardingStatus();
          // Show banner if user has NOT completed onboarding
          setShowBanner(!result.existing);
        } catch (error) {
          console.error("Failed to check profile status", error);
          setShowBanner(false);
        }
      }
      setLoading(false);
    };

    if (sessionStatus === 'authenticated' && session?.user) {
      checkStatus();
    } else if (sessionStatus === 'unauthenticated') {
      setLoading(false);
      setShowBanner(false);
    }
  }, [session, sessionStatus]);

  if (!showBanner || loading) return null;

  // Minimal variant - just a small inline link
  if (variant === "minimal") {
    return (
      <Link 
        href="/onboarding"
        className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium",
          "text-violet-600 dark:text-cyan-400 hover:text-violet-700 dark:hover:text-cyan-300",
          "transition-colors",
          className
        )}
      >
        <ExclamationTriangleIcon className="h-4 w-4" />
        <span>Complete your profile</span>
      </Link>
    );
  }

  // Card variant - standalone card for dashboards
  if (variant === "card") {
    return (
      <div className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-violet-50 via-white to-cyan-50",
        "dark:from-violet-900/20 dark:via-slate-800 dark:to-cyan-900/20",
        "border border-violet-200/60 dark:border-cyan-500/30",
        "shadow-sm",
        className
      )}>
        {/* Decorative elements */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-violet-400/10 to-cyan-400/10 dark:from-violet-500/5 dark:to-cyan-500/5 rounded-full blur-2xl" />
        
        <div className="relative p-5">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 shadow-lg shadow-violet-500/20 dark:shadow-cyan-500/10">
              <UserCircleIcon className="h-6 w-6 text-white" />
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Complete Your Profile
              </h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Your membership profile is incomplete. Complete it to access enrollment features and unlock all programs and courses.
              </p>

              {/* CTA Button */}
              <Link
                href="/onboarding"
                className={cn(
                  "mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-gradient-to-r from-violet-600 to-cyan-500",
                  "text-white text-sm font-semibold",
                  "hover:from-violet-700 hover:to-cyan-600",
                  "shadow-sm hover:shadow-md",
                  "transition-all duration-200",
                  "group"
                )}
              >
                <span>Complete Now</span>
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default inline variant - horizontal banner
  return (
    <div className={cn(
      "relative overflow-hidden rounded-xl",
      "bg-gradient-to-r from-violet-50 via-indigo-50 to-cyan-50",
      "dark:from-violet-900/30 dark:via-indigo-900/20 dark:to-cyan-900/30",
      "border border-violet-200/60 dark:border-cyan-600/30",
      className
    )}>
      <div className="relative px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 p-2 rounded-lg bg-violet-100 dark:bg-violet-500/20">
            <ExclamationTriangleIcon className="h-5 w-5 text-violet-600 dark:text-cyan-400" />
          </div>

          {/* Text */}
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              Profile incomplete!{" "}
              <span className="font-normal text-slate-600 dark:text-slate-300">
                Complete your membership registration to enroll in courses and programs.
              </span>
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/onboarding"
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg",
              "bg-gradient-to-r from-violet-600 to-cyan-500 hover:from-violet-700 hover:to-cyan-600",
              "dark:from-violet-600 dark:to-cyan-500 dark:hover:from-violet-500 dark:hover:to-cyan-400",
              "text-white text-sm font-semibold",
              "transition-colors",
              "group"
            )}
          >
            <span>Complete Profile</span>
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
