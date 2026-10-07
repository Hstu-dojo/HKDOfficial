import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";
import MeetDev from "@/components/sections/section-meet-developer";
import { GoogleGeminiEffectPWA } from "@/components/sections/section-app-install";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || siteConfig.url),
  title: "Dev",
  description: "Dev page",
};

export default function PageAbout() {
  return (
    <>
      <Header />
      <main>
        <MeetDev />
        <GoogleGeminiEffectPWA />
      </main>
      <Footer />
    </>
  );
}
