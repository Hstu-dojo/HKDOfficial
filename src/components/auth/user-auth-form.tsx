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
import { useI18n, useCurrentLocale } from "@/locales/client";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = React.useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const t = useI18n();
  const locale = useCurrentLocale();

  const tenantBaseDomain =
    (process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN as string | undefined) ||
    "p.hstuma.com";
  const isTenantHost = (() => {
    if (typeof window === "undefined") return false;
    const hostname = window.location.hostname.toLowerCase();
    const base = tenantBaseDomain.toLowerCase();
    return hostname.endsWith(`.${base}`) && hostname !== base && hostname !== `www.${base}`;
  })();
  
  // Show success message if redirected after email verification
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      toast.success(t("auth.login.emailVerified"), {
        description: t("auth.login.signInPrompt"),
      });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [t]);

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
                    toast.error(resendResult.error || t("auth.login.failedResend"));
                  }
                } catch (error) {
                  toast.error(t("auth.login.failedResend"));
                }
              },
            },
          });
        } else {
          toast.error(error.message || t("auth.login.invalidCredentials"));
        }
        return;
      }
      
      if (data.user) {
        toast.success(t("auth.login.welcomeBack"));
        
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          const verifyCallback = callbackUrl || "/";
          router.push(
            `/${locale}/onboarding/verify-email?callbackUrl=${encodeURIComponent(verifyCallback)}`,
          );
          setIsLoading(false);
          return;
        }

        // Redirect immediately after successful login.
        // This avoids relying on async session propagation timing.
        const destination = callbackUrl || "/";
        onLoginSuccess?.();

        if (pathname?.includes('/login')) {
          window.location.href = destination;
        } else {
          router.push(destination);
          router.refresh();
        }
        return;
      }
    } catch (error) {
      console.error(error);
      toast.error(t("auth.login.somethingWrong"));
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
            <div className="relative">
              <Input
                id="password"
                name="password"
                placeholder="XXXXXXXXXXXXXX"
                type={showPassword ? "text" : "password"}
                autoCapitalize="none"
                autoComplete="current-password"
                autoCorrect="off"
                disabled={isLoading}
                required={true}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
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
          {t("auth.login.newUser")}{" "}
          <Link className="hover:underline" href={`/${locale}/register`}>
            {t("auth.login.registerLink")}
          </Link>
        </small>
        <small>
          <Link className="hover:underline" href={`/${locale}/forget`}>
            {t("auth.login.forgetPassword")}
          </Link>
        </small>
      </div>
      <SocialLoginButtons
        redirectTo={callbackUrl || (isTenantHost ? "/profile" : `/${locale}/profile`)}
      />
    </div>
  );
}
