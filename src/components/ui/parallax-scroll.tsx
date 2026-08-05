"use client";
import { useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export const ParallaxScrollSecond = ({
  items,
  renderItem,
  className,
}: {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  className?: string;
}) => {
  const gridRef = useRef<any>(null);
  const { scrollYProgress } = useScroll({
    container: gridRef,
    offset: ["start start", "end start"],
  });

  const translateFirst = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const translateSecond = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const translateThird = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const translateFourth = useTransform(scrollYProgress, [0, 1], [0, 200]);

  const firstPart: { item: any; idx: number }[] = [];
  const secondPart: { item: any; idx: number }[] = [];
  const thirdPart: { item: any; idx: number }[] = [];
  const fourthPart: { item: any; idx: number }[] = [];

  items.forEach((item: any, idx: number) => {
    if (idx % 4 === 0) firstPart.push({ item, idx });
    else if (idx % 4 === 1) secondPart.push({ item, idx });
    else if (idx % 4 === 2) thirdPart.push({ item, idx });
    else fourthPart.push({ item, idx });
  });

  return (
    <div
      className={cn("h-[80vh] items-start overflow-y-auto w-full", className)}
      ref={gridRef}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 items-start gap-4 mx-auto w-full px-2 pb-10 pt-4">
        <div className="grid gap-4">
          {firstPart.map(({ item, idx }) => (
            <motion.div style={{ y: translateFirst }} key={"grid-1-" + idx}>
              {renderItem(item, idx)}
            </motion.div>
          ))}
        </div>
        <div className="grid gap-4">
          {secondPart.map(({ item, idx }) => (
            <motion.div style={{ y: translateSecond }} key={"grid-2-" + idx}>
              {renderItem(item, idx)}
            </motion.div>
          ))}
        </div>
        <div className="grid gap-4">
          {thirdPart.map(({ item, idx }) => (
            <motion.div style={{ y: translateThird }} key={"grid-3-" + idx}>
              {renderItem(item, idx)}
            </motion.div>
          ))}
        </div>
        <div className="grid gap-4">
          {fourthPart.map(({ item, idx }) => (
            <motion.div style={{ y: translateFourth }} key={"grid-4-" + idx}>
              {renderItem(item, idx)}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
