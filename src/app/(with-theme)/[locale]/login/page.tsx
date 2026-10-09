import { Metadata } from "next";
import Link from "next/link";
import { UserAuthForm } from "@/components/auth/user-auth-form";
import AuthPageLayout from "@/components/auth/auth-page-layout";
import { getI18n, getCurrentLocale } from "@/locales/server";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to Kaizen Karate Academy.",
};

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function AuthenticationPage({ searchParams }: PageProps) {
  const { callbackUrl } = await searchParams;
  const t = await getI18n();
  const locale = await getCurrentLocale();
  return (
    <AuthPageLayout
      locale={locale}
      brand={t("header.brand")}
      alternateHref={`/${locale}/register`}
      alternateLabel={t("header.register")}
      imageSrc="/image/kata.JPG"
      imageSide="left"
      imageTitle={t("hero.welcomeLine2")}
      imageDescription={t("hero.welcomeSubtitle")}
    >
      <div className="mx-auto flex w-full max-w-[400px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-3 text-center">
          <h1 className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl">{t("auth.login.title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("auth.login.subtitle")}</p>
        </div>
        <UserAuthForm callbackUrl={callbackUrl} />
        <p className="text-center text-sm leading-relaxed text-muted-foreground">
          {t("auth.login.termsPrefix")}{" "}
          <Link href={`/${locale}/terms`} className="underline underline-offset-4 hover:text-primary">{t("auth.login.termsOfService")}</Link>{" "}
          {t("auth.login.and")}{" "}
          <Link href={`/${locale}/privacy`} className="underline underline-offset-4 hover:text-primary">{t("auth.login.privacyPolicy")}</Link>.
        </p>
      </div>
    </AuthPageLayout>
  );
}
