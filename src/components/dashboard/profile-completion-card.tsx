import Link from "next/link";
import { UserCircleIcon, ArrowRightIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface ProfileCompletionCardProps {
  className?: string;
}

export function ProfileCompletionCard({ className }: ProfileCompletionCardProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl",
      "bg-gradient-to-br from-amber-50 via-white to-orange-50",
      "dark:from-amber-900/20 dark:via-slate-800 dark:to-orange-900/20",
      "border border-amber-200/60 dark:border-amber-500/30",
      "shadow-sm",
      className
    )}>
      {/* Decorative elements */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-gradient-to-br from-amber-400/10 to-orange-400/10 dark:from-amber-500/5 dark:to-orange-500/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-yellow-400/10 to-amber-400/10 dark:from-yellow-500/5 dark:to-amber-500/5 rounded-full blur-xl" />
      
      <div className="relative p-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0 p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/20 dark:shadow-amber-500/10">
            <ExclamationTriangleIcon className="h-7 w-7 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Complete Your Profile
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Your membership profile is incomplete. You need to complete it before you can enroll in courses, register for programs, or access member benefits.
            </p>

            {/* Features List */}
            <div className="mt-4 flex flex-wrap gap-2">
              {['Enroll in courses', 'Register for events', 'Track progress'].map((feature) => (
                <span 
                  key={feature}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300"
                >
                  {feature}
                </span>
              ))}
            </div>

            {/* CTA Button */}
            <Link
              href="/onboarding"
              className={cn(
                "mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg",
                "bg-gradient-to-r from-amber-500 to-orange-500",
                "text-white text-sm font-semibold",
                "hover:from-amber-600 hover:to-orange-600",
                "shadow-md hover:shadow-lg",
                "transition-all duration-200",
                "group"
              )}
            >
              <UserCircleIcon className="h-5 w-5" />
              <span>Complete Your Profile</span>
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
