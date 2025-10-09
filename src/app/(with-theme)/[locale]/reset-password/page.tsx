import { Metadata } from "next";

import { BackgroundBeams } from "@/components/ui/background-beams";
import Link from "next/link";
import ResetPasswordForm from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set your new password",
};

export default function ResetPasswordPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center">
      <BackgroundBeams />
      <div className="relative z-10 w-full max-w-md px-4">
        <div className="flex flex-col space-y-2 text-center mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Reset Password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your new password below
          </p>
        </div>
        
        <ResetPasswordForm />
        
        <div className="mt-4 text-center">
          <Link 
            href="/login" 
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}