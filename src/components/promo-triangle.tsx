"use client";
import { motion } from "framer-motion";
import { useId } from "react";
import { SVGProps } from "react";

const PromoTriangle = (props: SVGProps<SVGSVGElement>) => {
  const patternId = useId();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{
        delay: 0.5,
        duration: 0.5,
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        xmlSpace="preserve"
        className="absolute -left-[1300px] -top-[380px] -z-10 hidden w-[1850px] -rotate-[27deg]  lg:block xl:-left-[1180px]"
        viewBox="0 0 600 480"
        {...props}
      >
        <path
          fill={`url(#${patternId})`}
          d="M232.16 108.54 76.5 357.6c-33.3 53.28 5 122.4 67.84 122.4h311.32c62.83 0 101.14-69.12 67.84-122.4L367.84 108.54c-31.33-50.13-104.35-50.13-135.68 0Z"
          className="st0"
        />
        <defs>
          <pattern
            id={patternId}
            width={600}
            height={630}
            patternUnits="userSpaceOnUse"
          >
            <image
              xlinkHref="https://images.unsplash.com/photo-1529630218527-7df22fc2d4ee?q=80&w=1472&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              width={600}
              height={630}
              x={65}
              y={35}
            />
          </pattern>
        </defs>
      </svg>
    </motion.div>
  );
};
export default PromoTriangle;
