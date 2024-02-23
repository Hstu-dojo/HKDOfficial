"use client";

import * as React from "react";
import { useSession, signIn, getSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { FaGithub } from "react-icons/fa6";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
      // router.push(callbackUrl || "/");
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
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!response?.ok) {
        toast.error("invalid credentials or user not found");
      }
      if (response?.ok) {
        // console.log(response);
        toast.success("Welcome back!");
        // console.log(session);
        const updatedSession = await getSession();
        // console.log(updatedSession);
        //@ts-ignore
        if (updatedSession?.user?.emailVerified === false) {
          router.push(
            `/onboarding/verify-email?callbackUrl=${callbackUrl || "/"}`,
          );
        } else router.push(callbackUrl || "/");
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
      <Button
        variant="outline"
        type="button"
        disabled={isLoading}
        onClick={() => {
          signIn("github", {
            callbackUrl: callbackUrl || "/",
          });
          // signIn("github", { callbackUrl: callbackUrl || "/" });
        }}
      >
        {/* {isLoading ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
        )}{" "} */}
        <FaGithub className="mr-2" />
        GitHub
      </Button>
    </div>
  );
}
