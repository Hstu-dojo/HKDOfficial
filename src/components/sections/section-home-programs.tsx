"use client";
import { motion } from "framer-motion";
import IconBox from "@/components/icon-box";
import MaxWidthWrapper from "../maxWidthWrapper";
import Link from "next/link";
import { useCurrentLocale } from "@/locales/client";

export const homePrograms = [
  {
    icon: "/gif/1797-stretching.gif",
    title: "Training Courses",
    description: "Structured curriculum from White Belt to Black Belt. Master the art of Shotokan Karate.",
    href: "/karate/courses"
  },
  {
    icon: "/gif/660-karate-fight (1).gif",
    title: "Programs & Events",
    description: "Participate in workshops, seminars, and championships. Test your skills in the arena.",
    href: "/karate/programs"
  },
  {
     icon: "/gif/1022-podium-conference.gif",
     title: "Join HKD",
     description: "Become a member of the HSTU Karate Dojo family. Start your journey today.",
     href: "/onboarding"
  }
];

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

const SectionHomePrograms = () => {
    const locale = useCurrentLocale();
  return (
    <MaxWidthWrapper className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-900/50">
      <div className="container">
          <div className="flex justify-center">
            <div className="text-center lg:w-3/5">
              <h2 className="mb-12">
                Discover Our <span className="text-primary">Programs</span>
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
