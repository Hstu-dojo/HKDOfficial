import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";
import SectionPageTitle from "@/components/sections/section-page-title";
import MeetDev from "@/components/sections/section-meet-developer";


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
  title: "Dev",
  description: "Dev page",
};

export default function PageAbout() {
  return (
    <>
      <Header />
      <main>
        <MeetDev />
      </main>
      <Footer />
    </>
  );
}
