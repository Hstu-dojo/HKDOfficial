"use client";
import { motion } from "framer-motion";
import IconBox from "@/components/icon-box";
import SectionTitle from "./section-title";
import { useScopedI18n } from "@/locales/client";

const fadeInAnimationVariants = {
  initial: {
    opacity: 0,
    y: 60,
  },
  animate: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.05 * index,
    },
  }),
};

const SectionIconBoxesLayout3 = ({ noTitle }: { noTitle?: boolean }) => {
  const t = useScopedI18n("services");

  const iconBoxes = [
    {
      icon: "/icons/deadline-5926_5778aee2-b372-4b21-94a1-c9fc06ac464c.svg",
      title: t("reasons.items.fastResults.title"),
      description: t("reasons.items.fastResults.description"),
    },
    {
      icon: "/icons/medal-3141_6860a6ec-597a-49e1-a5d2-dd4b070acef3.svg",
      title: t("reasons.items.awardWinning.title"),
      description: t("reasons.items.awardWinning.description"),
    },
    {
      icon: "/icons/medical-research-6506_05214fe4-cb2e-4171-ac03-72168bf2981b.svg",
      title: t("reasons.items.competitionAnalysis.title"),
      description: t("reasons.items.competitionAnalysis.description"),
    },
    {
      icon: "/icons/customer-support-4912_a5517329-a472-47b5-8155-d507da181405.svg",
      title: t("reasons.items.customerSupport.title"),
      description: t("reasons.items.customerSupport.description"),
    },
    {
      icon: "/icons/pay-2643_cf4ecaa0-bcfb-4c2b-91e1-7353cb0dccdd.svg",
      title: t("reasons.items.moneyBack.title"),
      description: t("reasons.items.moneyBack.description"),
    },
    {
      icon: "/icons/handshake-3124_670c4553-214a-4d06-830f-4d0855736c60.svg",
      title: t("reasons.items.customerLoyalty.title"),
      description: t("reasons.items.customerLoyalty.description"),
    },
  ];

  return (
    <section className="pb-10 pt-16 lg:pb-20 lg:pt-24">
      <div className="container">
        {!noTitle && (
          <SectionTitle
            subtitle={t("reasons.subtitle")}
            sectionClasses="mx-auto max-w-xl text-center mb-12"
            titleClasses="mb-3 text-center"
            subtitleClasses="text-md font-medium"
          >
            {t("reasons.title")}
          </SectionTitle>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-10">
          {iconBoxes.map((iconBox, index) => {
            return (
              <motion.div
                key={index}
                variants={fadeInAnimationVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{
                  delay: 0.5,
                }}
                custom={index}
              >
                <IconBox
                  iconBox={iconBox}
                  className="py-7 text-center shadow-none before:hidden"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SectionIconBoxesLayout3;
