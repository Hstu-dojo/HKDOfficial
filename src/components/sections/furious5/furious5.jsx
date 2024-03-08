"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { staggerContainer } from "@/utils/motion";
import styles from "./styles";
import { TypingText, TitleText } from "./components/CustomTexts";
import ExploreCard from "./components/ExploreCard";
import { exploreWorlds } from "./exploreWorlds";
import TypewriterEffectComponent from "@/components/blogs/shared/TypewriterEffectComponent";

const Furious5 = () => {
  const [active, setActive] = useState("world-2");
  return (
    <section className={`${styles.paddings}`} id="explore">
      <motion.div
        // @ts-ignore
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.25 }}
        className={`${styles.innerWidth} mx-auto flex flex-col`}
      >
        {/* <TitleText
          title={
            <>
              Choose the world you want <br className="hidden md:block" /> to
              explore
            </>
          }
          textStyles="text-center"
        /> */}
        <div className="mt-20 lg:mt-28 mb-10 text-center"><TypewriterEffectComponent text={"Start your new amazing journey with us"} /></div>
        
        <TypingText title="| Meet Furious Five" textStyles="text-center" />

        <div className="mt-[50px] flex min-h-[70vh] flex-col gap-5 lg:flex-row">
          {exploreWorlds.map((world, index) => (
            <ExploreCard
              key={world.id}
              {...world}
              index={index}
              active={active}
              handleClick={setActive}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default Furious5;
