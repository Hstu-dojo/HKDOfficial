import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  UserAuthForm,
  UserAuthFormProps,
} from "@/components/auth/user-auth-form";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { getI18n, getCurrentLocale } from "@/locales/server";
interface ExtendedUserAuthFormProps extends UserAuthFormProps {
  callbackUrl: string;
}

export const metadata: Metadata = {
  title: "Login",
  description: "Authentication forms built using the components.",
};

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function AuthenticationPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const callbackUrl = resolvedSearchParams?.callbackUrl;
  const t = await getI18n();
  const locale = await getCurrentLocale();
  
  return (
    <>
      <Link href="/">
        <div className="absolute z-20 flex items-center px-10 pt-6 text-lg font-medium text-white md:pt-8">
          <Image
            src="/logo.png"
            className="mr-3"
            alt="Logo"
            width={36}
            height={36}
          />
          <span className="hidden lg:flex">{t('header.brand')}</span>
        </div>
      </Link>
      <div className="container relative  grid h-[800px] flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
        <Link
          href={`/${locale}/register`}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute right-4 top-4 md:right-8 md:top-8",
          )}
        >
          {t('header.register')}
        </Link>

        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-secondary">
            <Image
              src="/image/kata.JPG"
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
                &ldquo;{t("auth.login.quote")}&rdquo;
              </p>
              <footer className="text-sm">{t("auth.login.quoteAuthor")}</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <BackgroundBeams />
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                {t('auth.login.title')}
              </h1>
              <p className="text-sm text-muted-foreground">
                {t('auth.login.subtitle')}
              </p>
            </div>

            <UserAuthForm callbackUrl={callbackUrl?.toString()} />
            <p className="px-8 text-center text-sm text-muted-foreground">
              {t('auth.login.termsPrefix')}{" "}
              <Link
                href="/terms"
                className="underline underline-offset-4 hover:text-primary"
              >
                {t('auth.login.termsOfService')}
              </Link>{" "}
              {t('auth.login.and')}{" "}
              <Link
                href="/privacy"
                className="underline underline-offset-4 hover:text-primary"
              >
                {t('auth.login.privacyPolicy')}
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
