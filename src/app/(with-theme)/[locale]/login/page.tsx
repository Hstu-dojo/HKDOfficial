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
      <Link
        href={`/${locale}`}
        className="absolute top-4 left-4 md:top-8 md:left-8 z-30 flex flex-row items-center gap-3 text-lg font-semibold tracking-tight transition-opacity hover:opacity-90 text-foreground lg:text-white"
      >
        <Image
          src="/kaizen.png"
          alt={t('header.brand')}
          width={40}
          height={40}
          priority
          className="h-10 w-10 object-contain drop-shadow"
        />
        <span className="hidden sm:inline-block">{t('header.brand')}</span>
      </Link>
      <div className="container relative flex min-h-screen flex-col pt-24 pb-8 lg:grid lg:max-w-none lg:grid-cols-2 lg:items-center lg:justify-center lg:px-0 lg:py-0">
        <Link
          href={`/${locale}/register`}
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "absolute right-4 top-4 md:right-8 md:top-8 z-20",
          )}
        >
          {t('header.register')}
        </Link>

        <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
          <div className="absolute inset-0 bg-secondary">
            <Image
              src="/image/kata.JPG"
              alt="Hero"
              fill
              // add gradient overlay
              className="absolute inset-0 object-cover object-center"
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
        <div className="flex-1 lg:p-8 flex flex-col justify-center">
          <BackgroundBeams />
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-3 text-center items-center">
              <Link
                href={`/${locale}`}
                className="mb-1 inline-flex items-center justify-center transition-transform hover:scale-105"
                aria-label={t('header.brand')}
              >
                <Image
                  src="/kaizen.png"
                  alt={t('header.brand')}
                  width={80}
                  height={80}
                  priority
                  className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-md"
                />
              </Link>
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
