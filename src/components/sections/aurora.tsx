"use client";

import { motion } from "framer-motion";
import React from "react";
import { AuroraBackground } from "../ui/aurora-background";

export default function AuroraBd() {
  return (
    <AuroraBackground className="!min-h-[120px] !max-h-[180px] !h-[20vh]">
      <motion.div
        initial={{ opacity: 0.0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.2,
          duration: 0.6,
          ease: "easeInOut",
        }}
        className="relative flex flex-col items-center justify-center gap-1 px-4"
      >
        <div className="text-center text-xl font-bold dark:text-white md:text-3xl">
          One more step to your dream DOJO.
        </div>
        <div className="text-sm font-extralight dark:text-neutral-200 md:text-lg">
          Fill following info cautiously.
        </div>
      </motion.div>
    </AuroraBackground>
  );
}
