"use client";

import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "@heroicons/react/20/solid";
import { useI18n } from "@/locales/client";

const SectionCTALayout4 = () => {
  const t = useI18n();
  
  return (
    <section className="bg-muted px-6 py-24 dark:bg-slate-900">
      <div className="container">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="mb-8">
              {t('about.cta.title')}
            </h2>
            <Button size="lg">
              {t('about.cta.button')}
              <ChevronRightIcon width={20} height={20} className="-mr-2 ml-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SectionCTALayout4;
