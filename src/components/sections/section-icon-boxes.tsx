"use client";
import { motion } from "framer-motion";
import IconBox from "@/components/icon-box";
import MaxWidthWrapper from "../maxWidthWrapper";
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

const SectionIconBoxes = ({ noTitle }: { noTitle?: boolean }) => {
  const t = useScopedI18n("homepage.iconBoxes");
  const tHero = useScopedI18n("hero");

  const iconBoxes = [
    {
      icon: "/gif/1797-stretching.gif",
      title: t("training.title"),
      description: t("training.description"),
    },
    {
      icon: "/gif/1022-podium-conference.gif",
      title: t("workshops.title"),
      description: t("workshops.description"),
    },
    {
      icon: "/gif/660-karate-fight (1).gif",
      title: t("competitions.title"),
      description: t("competitions.description"),
    },
  ];

  return (
    <MaxWidthWrapper className="py-16 lg:py-24">
      <div className="container">
        {!noTitle && (
          <div className="flex justify-center">
            <div className="text-center lg:w-3/5">
              <h2 className="mb-12">
                {tHero("joinDojo")}
              </h2>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-10">
          {iconBoxes.map((iconBox, index) => {
            return (
              <motion.div
                key={iconBox.title}
                variants={fadeInAnimationVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{
                  delay: 0.5,
                }}
                custom={index}
              >
                <IconBox iconBox={iconBox} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </MaxWidthWrapper>
  );
};

export default SectionIconBoxes;
