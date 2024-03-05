"use client";
import { useEffect, useRef } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";
import { useInView } from "react-intersection-observer";

export const TextGenerateEffect = ({
  words,
  className,
}: {
  words: string;
  className?: string;
}) => {
  const [scope, animate] = useAnimate();
  const [ref, inView] = useInView({
    triggerOnce: true,
  });

  let wordsArray = words.split(" ");

  useEffect(() => {
    if (inView) {
      animate(
        "span",
        {
          opacity: 1,
        },
        {
          duration: 2,
          delay: stagger(0.2),
        },
      );
    }
  }, [inView, scope.current]);

  const handleHover = () => {
    const spans = scope.current.querySelectorAll(".text-animate");
    spans.forEach((span: any, idx: any) => {
      animate(
        span,
        {
          opacity: 0,
        },
        {
          duration: 0.5 * (spans.length - idx), // Adjust the duration based on the index
        },
      );
    });
  };

  const renderWords = () => {
    return (
      <motion.div
        ref={scope}
        onHoverStart={handleHover}
        onHoverEnd={() => animate("span", { opacity: 1 })}
      >
        {wordsArray.map((word, idx) => (
          <motion.span
            key={word + idx}
            className="text-animate text-gray-700 opacity-0"
          >
            {word}{" "}
          </motion.span>
        ))}
      </motion.div>
    );
  };

  return (
    <div className={cn("", className)} ref={ref}>
      <div className="mt-4">
        <div className="leading-snug text-gray-600">{renderWords()}</div>
      </div>
    </div>
  );
};
