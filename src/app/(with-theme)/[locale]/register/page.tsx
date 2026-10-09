import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import AuthPageLayout from "@/components/auth/auth-page-layout";
import { getI18n, getCurrentLocale } from "@/locales/server";

export const metadata: Metadata = {
  title: "Register",
  description: "Join Kaizen Karate Academy.",
};

export default async function AuthenticationPage() {
  const t = await getI18n();
  const locale = await getCurrentLocale();
  return (
    <AuthPageLayout
      locale={locale}
      brand={t("header.brand")}
      alternateHref={`/${locale}/login`}
      alternateLabel={t("header.login")}
      imageSrc="/image/punch.JPG"
      imageSide="right"
      imageTitle={t("hero.welcomeLine2")}
      imageDescription={t("hero.welcomeSubtitle")}
    >
      <div className="mx-auto flex w-full max-w-[520px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-3 text-center">
          <h1 className="text-3xl font-normal leading-tight tracking-tight sm:text-4xl">{t("auth.register.title")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("auth.register.subtitle")}</p>
        </div>
        <RegisterForm />
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
