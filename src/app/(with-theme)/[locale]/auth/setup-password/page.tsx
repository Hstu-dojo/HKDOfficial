import { Metadata } from "next";
import { BackgroundBeams } from "../../../../../components/ui/background-beams";
import { SetupPasswordForm } from "../../../../../components/auth/setup-password-form";

export const metadata: Metadata = {
  title: "Setup Password",
  description: "Set up your password for email login",
};

interface PageProps {
  searchParams: {
    email?: string;
    provider?: string;
    callbackUrl?: string;
  };
}

export default function SetupPasswordPage({ searchParams }: PageProps) {
  const { email, provider, callbackUrl } = searchParams;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center">
      <BackgroundBeams />
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Setup Your Password
          </h1>
          <p className="text-sm text-muted-foreground">
            You've successfully signed in with {provider}. Set up a password to enable email login in the future.
          </p>
          {email && (
            <p className="text-xs text-muted-foreground">
              Account: {email}
            </p>
          )}
        </div>
        <SetupPasswordForm email={email} provider={provider} callbackUrl={callbackUrl} />
        <div className="px-8 text-center text-sm text-muted-foreground">
          <p>You can skip this step and continue using {provider} to sign in.</p>
        </div>
      </div>
    </div>
  );
}