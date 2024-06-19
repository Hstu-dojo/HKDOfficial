"use client";
import { motion } from "framer-motion";
import IconBox from "@/components/icon-box";
import MaxWidthWrapper from "../maxWidthWrapper";

export const iconBoxes = [
  {
    icon: "/gif/1797-stretching.gif",
    title: "Training Programs",
    description:
      "Join our comprehensive training programs to enhance your physical fitness, mental acuity, and technical proficiency in karate.",
  },
  {
    icon: "/gif/1022-podium-conference.gif",
    title: "Workshops and Seminars",
    description:
      "Participate in our workshops and seminars to learn more about karate and self-defense, and engage with the community.",
  },
  {
    icon: "/gif/660-karate-fight (1).gif",
    title: "Competitions",
    description:
      "Compete in intra-university and inter-university championships to showcase your skills and bring honor to HSTU.",
  },
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

const SectionIconBoxes = ({ noTitle }: { noTitle?: boolean }) => {
  return (
    <MaxWidthWrapper className="py-16 lg:py-24">
      <div className="container">
        {!noTitle && (
          <div className="flex justify-center">
            <div className="text-center lg:w-3/5">
              <h2 className="mb-12">
                Are you ready to{" "}
                <span className="text-primary">join our dojo</span>? Discover
                the path to excellence in karate.
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
