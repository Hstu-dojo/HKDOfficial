"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/utils/motion";
import styles from "./styles";
import { TypingText, TitleText } from "./components/CustomTexts";
import ExploreCard from "./components/ExploreCard";
import { exploreWorlds } from "./exploreWorlds";
import MaxWidthWrapper from "@/components/maxWidthWrapper";
import { useScopedI18n } from "@/locales/client";

// Map IDs to translation keys
const warriorKeys = {
  "warrior-1": "viper",
  "warrior-2": "mantis",
  "warrior-3": "monk",
  "warrior-4": "tigress",
  "warrior-5": "crane",
};

const Furious5 = () => {
  const [active, setActive] = useState("world-2");
  const t = useScopedI18n("homepage.furious5");

  return (
    <MaxWidthWrapper>
      <section className={`${styles.paddings}`} id="explore">
        <motion.div
          // @ts-ignore
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.25 }}
          className={`${styles.innerWidth} mx-auto flex flex-col`}
        >
          <TitleText
            title={
              <>
                {t("title").split(" ").slice(0, 4).join(" ")} <br className="hidden md:block" /> {t("title").split(" ").slice(4).join(" ")}
              </>
            }
            textStyles="text-center"
          />
          {/* <div className="mt-20 lg:mt-28 mb-10 text-center"><TypewriterEffectComponent text={"Start your new amazing journey with us"} /></div> */}

          <TypingText title={`| ${t("subtitle")}`} textStyles="text-center" />

          <div className="mt-[50px] flex min-h-[400px] flex-col gap-5 lg:flex-row">
            {exploreWorlds.map((world, index) => (
              <ExploreCard
                key={world.id}
                {...world}
                title={t(warriorKeys[world.id])}
                index={index}
                active={active}
                handleClick={setActive}
              />
            ))}
          </div>
        </motion.div>
      </section>
    </MaxWidthWrapper>
  );
};

export default Furious5;
