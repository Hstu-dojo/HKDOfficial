"use client";
import PromoTriangle from "@/components/promo-triangle";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import MaxWidthWrapper from "../maxWidthWrapper";
import { useScopedI18n } from "@/locales/client";

const SectionPromo = () => {
  const t = useScopedI18n("homepage.promo");
  return (
    <MaxWidthWrapper className="relative overflow-hidden pb-28 pt-10 lg:pb-64 lg:pt-24">
      <PromoTriangle />
      <div className="container">
        <div className="lg:ml-auto lg:w-[45%]">
          <h2 className="max-w-md">
            {t("title")}
          </h2>
          <p className="mb-10 text-lg">
            {t("description")}
          </p>
          <Button>
            {t("joinNow")}
            <ChevronRightIcon width={20} height={20} className="-mr-2 ml-4" />
          </Button>
        </div>
      </div>
    </MaxWidthWrapper>
  );
};

export default SectionPromo;
