// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import styles from "../styles";
import { fadeIn } from "@/utils/motion";

const ExploreCard = ({ id, imgUrl, title, index, active, handleClick }) => (
  <motion.div
    variants={fadeIn("right", "spring", index * 0.5, 0.75)}
    className={`relative ${
      active === id ? "flex-[10] lg:flex-[3.5]" : "flex-[2] lg:flex-[0.5]"
    } duration-[0.7s] ease-out-flex flex h-[700px] min-w-[170px] cursor-pointer items-center justify-center transition-[flex]`}
    onClick={() => handleClick(id)}
  >
    <Image
      src={imgUrl}
      height={700}
      width={500}
      alt="planet-04"
      // style={
      //   !(active === id)
      //     ? {
      //         mixBlendMode: "overlay",
      //         // filter: "grayscale(1) contrast(1.2) opacity(0.6)",
      //         // stop open at other window
      //         pointerEvents: "none",
      //       }
      //     : {
      //         mixBlendMode: "screen",
      //         // filter: "grayscale(1) contrast(1.2) opacity(0.6)",
      //         // stop open at other window
      //         pointerEvents: "none",
      //       }
      // }
      className={`absolute h-full w-full rounded-[24px] object-cover pointer-events-none ${active===id?"":"blur-sm"}`}
    />
    {active !== id ? (
      <h3 className="absolute z-0 text-[18px] font-semibold text-white sm:text-[26px] lg:bottom-20 lg:origin-[0,0] lg:rotate-[-90deg]">
        {title}
      </h3>
    ) : (
      <div className="absolute bottom-0 flex h-[150px] w-full flex-col justify-evenly rounded-b-[24px] bg-[rgba(0,0,0,0.5)] p-8">
        <div
          className={`${styles.flexCenter} glassmorphism mb-[16px] h-[50px] w-[60px] rounded-[24px]`}
        >
          <Image
            height={200}
            width={200}
            src="/headset.svg"
            alt="headset"
            className="h-50 w-50 object-cover"
          />
        </div>
        <p className="text-[16px] font-normal uppercase leading-[20.16px] text-white">
          Enter Metaverse
        </p>
        <h2 className="mt-[24px] text-[24px] font-semibold text-white sm:text-[32px]">
          {title}
        </h2>
      </div>
    )}
  </motion.div>
);

export default ExploreCard;
