import MaxWidthWrapper from "../maxWidthWrapper";
import SectionTitle from "./section-title";
import Image from "next/image";
import { getScopedI18n } from "@/locales/server";

const SectionPartners = async () => {
    const t = await getScopedI18n("homepage.partners");
  return (
    <section className="relative bg-white pb-56 pt-24 before:absolute before:inset-0 before:bg-gradient-to-t before:from-tertiary before:to-secondary before:opacity-70">
      <Image
        src="/partners/map.png"
        alt="Partners"
        fill
        className="object-cover object-center opacity-50"
      />
      <MaxWidthWrapper className="container relative">
        <SectionTitle
          subtitle={t("description")}
          sectionClasses="mx-auto max-w-xl text-center mb-12"
          titleClasses="mb-3 text-center text-white"
          subtitleClasses="text-md font-medium text-white"
        >
          {t("subtitle")}
        </SectionTitle>
        <div className="flex flex-wrap justify-center">
          <Image
            src="/image/hstu.png"
            alt="partner 1"
            width={73}
            height={73}
            className="m-2 object-cover object-center md:m-5"
          />
          <Image
            src="/image/sdch.jpg"
            alt="partner 2"
            width={73}
            height={73}
            className="m-2 object-cover object-center md:m-5"
          />
        </div>
      </MaxWidthWrapper>
    </section>
  );
};

export default SectionPartners;
