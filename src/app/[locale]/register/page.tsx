import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register",
  description: "Authentication forms built using the components.",
};

export default function AuthenticationPage() {
  return (
    <>
      <Link href="/">
        <div className="absolute right-10 z-20 flex flex-row-reverse items-center pt-6 text-lg font-medium text-white md:pt-8">
          <Image
            src="/logo.png"
            className="ml-3"
            alt="Logo"
            width={36}
            height={36}
          />
          <span className="hidden lg:flex">HSTU Dojo</span>
        </div>
      </Link>
      <div className="container relative  grid h-[800px] flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Create an account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your credentials below to create your account
              </p>
            </div>
            <RegisterForm />
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
        <Link
          href="/login"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute left-4 top-4 md:left-8 md:top-8",
          )}
        >
          Login
        </Link>
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-secondary">
            <Image
              src="/image/punch.JPG"
              alt="Hero"
              layout="fill"
              objectFit="cover"
              objectPosition="center"
              // add gradient overlay
              className="absolute inset-0"
              style={{
                mixBlendMode: "multiply",
                filter: "grayscale(1) contrast(1.2) opacity(0.6)",
                // stop open at other window
                pointerEvents: "none",
              }}
            />
          </div>

          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This library has saved me countless hours of work and
                helped me deliver stunning designs to my clients faster than
                ever before.&rdquo;
              </p>
              <footer className="text-sm">Hasan</footer>
            </blockquote>
          </div>
        </div>
      </div>
    </>
  );
}
