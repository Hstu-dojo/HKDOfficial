import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";
import SectionPageTitle from "@/components/sections/section-page-title";
import SectionGoogleMap from "@/components/sections/section-google-map";
import SectionContactForm from "@/components/sections/section-contact-form";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
  title: "Contact",
  description: "Contact page",
};

export default function PageContact() {
  return (
    <>
      <Header />
      <main className="relative">
        <SectionPageTitle subtitle="Let’s have a dicussion about your business">
          Contact
        </SectionPageTitle>
        <SectionContactForm />
        {/* <SectionGoogleMap /> */}
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3595.2452786600243!2d88.6558029!3d25.696301800000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39e4ad6436019f17%3A0x22eff3e4e21fc86d!2sHSTU%20Karate%20Dojo!5e0!3m2!1sen!2sbd!4v1706819240577!5m2!1sen!2sbd"
          width="100%"
          height="450"
          // style="border:0;"
          allowFullScreen={true}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          //black theme
          className="filter dark:invert"
        ></iframe>
      </main>
      <Footer />
    </>
  );
}
