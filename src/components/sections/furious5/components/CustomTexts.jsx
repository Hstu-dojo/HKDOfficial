// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { textContainer, textVariant2 } from "@/utils/motion";

export const TypingText = ({ title, textStyles }) => (
  <motion.p
    variants={textContainer}
    className={`text-muted-foreground text-sm font-normal ${textStyles}`}
  >
    {title}
  </motion.p>
);

export const TitleText = ({ title, textStyles }) => (
  <motion.h2
    variants={textVariant2}
    initial="hidden"
    whileInView="show"
    className={`mt-2 font-serif text-3xl font-normal md:text-5xl ${textStyles}`}
  >
    {title}
  </motion.h2>
);
