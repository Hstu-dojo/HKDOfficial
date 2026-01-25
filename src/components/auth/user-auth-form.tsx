"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSessionCompat";
import { createClient } from "@/lib/supabase/client";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useI18n } from "@/locales/client";
export interface UserAuthFormProps
  extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string;
  onLoginSuccess?: () => void;
}

export function UserAuthForm({
  className,
  callbackUrl,
  onLoginSuccess,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [loginSuccess, setLoginSuccess] = React.useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useI18n();
  
  // Show success message if redirected after email verification
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      toast.success("Email verified successfully! 🎉", {
        description: "You can now sign in with your credentials.",
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);
  
  // Handle redirect after login success and session update
  React.useEffect(() => {
    // Only redirect if login was successful and we have a session
    if (loginSuccess && status === 'authenticated' && session?.user?.email) {
      const destination = callbackUrl || "/en";
      // If we're in a modal (pathname includes /login), replace the URL
      if (pathname?.includes('/login')) {
        // Use replace to avoid adding to history stack
        window.location.href = destination;
      } else {
        router.push(destination);
      }
    }
  }, [loginSuccess, status, session?.user?.email, callbackUrl, pathname, router]);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
    // get the form data
    const form = event.currentTarget as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      // Use Supabase client directly instead of API route
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase Auth Error:', error);
        setIsLoading(false);
        
        // Handle email not confirmed error with resend option
        if (error.message === 'Email not confirmed') {
          toast.error('Please check your email and click the confirmation link before signing in.', {
            action: {
              label: "Resend Email",
              onClick: async () => {
                try {
                  const resendResponse = await fetch("/api/auth/resend-confirmation", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email }),
                  });
                  
                  const resendResult = await resendResponse.json();
                  
                  if (resendResponse.ok) {
                    toast.success(resendResult.message);
                  } else {
                    toast.error(resendResult.error || "Failed to resend email");
                  }
                } catch (error) {
                  toast.error("Failed to resend email");
                }
              },
            },
          });
        } else {
          toast.error(error.message || "Invalid credentials or user not found");
        }
        return;
      }
      
      if (data.user) {
        toast.success("Welcome back!");
        
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          router.push(
            `/en/onboarding/verify-email?callbackUrl=${callbackUrl || "/en"}`,
          );
          setIsLoading(false);
          return;
        }
        
        // Mark login as successful - the useEffect will handle redirect
        setLoginSuccess(true);
        
        // Call the onLoginSuccess callback if provided (for modal to close)
        onLoginSuccess?.();
        
        // Refresh router to update session state
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="email">
              {t('auth.login.emailLabel')}
            </Label>
            <Input
              id="email"
              name="email"
              placeholder="name@example.com"
              type="email"
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect="off"
              disabled={isLoading}
              required={true}
            />
          </div>
          <div className="grid gap-1">
            <Label className="sr-only" htmlFor="password">
              {t('auth.login.passwordLabel')}
            </Label>
            <Input
              id="password"
              name="password"
              placeholder="XXXXXXXXXXXXXX"
              type="password"
              autoCapitalize="none"
              autoComplete="password"
              autoCorrect="off"
              disabled={isLoading}
              required={true}
            />
          </div>
          <Button disabled={isLoading}>
            {/* {isLoading && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )} */}
            {t('auth.login.signInButton')}
          </Button>
        </div>
      </form>
      <div className="flex-rol relative bottom-4 flex flex-wrap items-center justify-between">
        <small>
          {t('auth.login.newUser')}{" "}
          <Link className="hover:underline" href="/register">
            {t('auth.login.registerLink')}
          </Link>
        </small>
        <small>
          <Link className="hover:underline" href="/en/forget">
            {t('auth.login.forgetPassword')}
          </Link>
        </small>
      </div>
      <SocialLoginButtons redirectTo={callbackUrl || '/en/profile'} />
    </div>
  );
}
