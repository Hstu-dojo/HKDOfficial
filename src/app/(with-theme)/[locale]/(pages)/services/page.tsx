import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";
import SectionPageTitle from "@/components/sections/section-page-title";
import SectionIconBoxes from "@/components/sections/section-icon-boxes";
import SectionCTALayout4 from "@/components/sections/section-cta-layout-4";
import SectionPromoVideo from "@/components/sections/section-promo-video";
import SectionIconBoxesLayout3 from "@/components/sections/section-icon-boxes-layout-3";
import { getI18n } from "@/locales/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18n();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
    title: t("services.metadataTitle"),
    description: t("services.metadataDescription"),
  };
}

export default async function PageServices() {
  const t = await getI18n();

  return (
    <>
      <Header />
      <main className="relative">
        <SectionPageTitle subtitle={t("services.pageSubtitle")}>
          {t("services.pageTitle")}
        </SectionPageTitle>
        <SectionIconBoxes noTitle />
        <SectionPromoVideo />
        <SectionIconBoxesLayout3 />
        <SectionCTALayout4 />
      </main>
      <Footer />
    </>
  );
}
