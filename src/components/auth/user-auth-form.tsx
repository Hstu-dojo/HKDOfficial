"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FaGithub, FaGoogle } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useSession } from "@/hooks/useSessionCompat";
import { supabase } from "@/lib/supabase/supabase";
export interface UserAuthFormProps
  extends React.HTMLAttributes<HTMLDivElement> {
  callbackUrl?: string;
}

export function UserAuthForm({
  className,
  callbackUrl,
  ...props
}: UserAuthFormProps) {
  // console.log(callbackUrl);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const { data: session } = useSession();
  const router = useRouter();
  React.useLayoutEffect(() => {
    if (session?.user?.email) {
      router.push("/");
    }
  }, [callbackUrl, router, session?.user?.email]);
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
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase Auth Error:', error);
        
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
      } else if (data.user) {
        toast.success("Welcome back!");
        
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          router.push(
            `/en/onboarding/verify-email?callbackUrl=${callbackUrl || "/en"}`,
          );
        } else {
          router.push(callbackUrl || "/en/profile");
        }
      }
      setIsLoading(false);
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
              Email
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
              Email
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
            Sign In with Email
          </Button>
        </div>
      </form>
      <div className="flex-rol relative bottom-4 flex flex-wrap items-center justify-between">
        <small>
          new user?{" "}
          <Link className="hover:underline" href="/register">
            Register
          </Link>
        </small>
        <small>
          <Link className="hover:underline" href="/forget">
            forget password?
          </Link>
        </small>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground dark:bg-slate-800">
            Or continue with
          </span>
        </div>
      </div>
      <div className="flex justify-center space-x-4">
        <Button
          className="flex h-12 w-12 items-center justify-center rounded-full p-3"
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={async () => {
            // TODO: Implement Supabase Google OAuth
            toast.info("Google sign-in will be implemented with Supabase OAuth");
          }}
        >
          <FaGoogle className="h-6 w-6" />
        </Button>
        <Button
          className="flex h-12 w-12 items-center justify-center rounded-full p-3"
          variant="outline"
          type="button"
          disabled={isLoading}
          onClick={async () => {
            // TODO: Implement Supabase GitHub OAuth  
            toast.info("GitHub sign-in will be implemented with Supabase OAuth");
          }}
        >
          <FaGithub className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}
