"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function VerificationHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const verified = searchParams.get('verified');
    const showLogin = searchParams.get('showLogin');

    if (verified === 'true') {
      // Show success toast
      toast.success("Email verified successfully! 🎉", {
        description: "Your account is now active. Please sign in to continue.",
        duration: 6000,
        action: showLogin === 'true' ? {
          label: "Sign In",
          onClick: () => {
            router.push('/login');
          },
        } : undefined,
      });

      // Clean up URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('verified');
      url.searchParams.delete('showLogin');
      window.history.replaceState({}, '', url.pathname);

      // If showLogin is true, redirect to login after a short delay
      if (showLogin === 'true') {
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    }
  }, [searchParams, router]);

  return null;
}
