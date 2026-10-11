import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";
import MeetDev from "@/components/sections/section-meet-developer";
import SectionPageTitle from "@/components/sections/section-page-title";
import { getI18n } from "@/locales/server";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || siteConfig.url),
  title: "Dev",
  description: "Dev page",
};

export default async function PageAbout() {
  const t = await getI18n();
  return (
    <>
      <Header />
      <main className="public-page">
        <SectionPageTitle>{t("dev.title")}</SectionPageTitle>
        <MeetDev />
      </main>
      <Footer />
    </>
  );
}
