"use client";
import { motion } from "framer-motion";
import IconBox from "@/components/icon-box";
import MaxWidthWrapper from "../maxWidthWrapper";
import Link from "next/link";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";

const SectionHomePrograms = () => {
    const locale = useCurrentLocale();
    const t = useScopedI18n("homepage.programs");

    const homePrograms = [
      {
        icon: "/gif/1797-stretching.gif",
        title: t("training.title"),
        description: t("training.description"),
        href: "/karate/courses"
      },
      {
        icon: "/gif/660-karate-fight (1).gif",
        title: t("events.title"),
        description: t("events.description"),
        href: "/karate/programs"
      },
      {
         icon: "/gif/1022-podium-conference.gif",
         title: t("join.title"),
         description: t("join.description"),
         href: "/onboarding"
      }
    ];

  return (
    <MaxWidthWrapper className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container">
          <div className="flex justify-center">
            <div className="text-center lg:w-3/5">
              <h2 className="mb-12">
                 {t("title").replace(t("titleSpan"), "")} <span className="text-primary">{t("titleSpan")}</span>
              </h2>
            </div>
          </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-10">
          {homePrograms.map((box, index) => {
            return (
              <motion.div
                key={box.title}
                variants={fadeInAnimationVariants}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                transition={{
                  delay: 0.5,
                }}
                custom={index}
              >
                <Link href={`/${locale}${box.href}`}>
                    <div className="h-full cursor-pointer hover:-translate-y-2 transition-transform duration-300">
                         {/* @ts-ignore */}
                         <IconBox iconBox={box} className="h-full bg-white dark:bg-slate-800 shadow-sm hover:shadow-xl" />
                    </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </MaxWidthWrapper>
  );
};

export default SectionHomePrograms;
