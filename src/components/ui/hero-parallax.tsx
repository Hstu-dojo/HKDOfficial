"use client";
import React from "react";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  MotionValue,
} from "framer-motion";
import Image from "next/image";
import NewsletterForm from "../forms/newsletter-form";
import HeroTriangle from "@/components/hero-triangle";
import MaxWidthWrapper from "../maxWidthWrapper";
import { useScopedI18n } from "@/locales/client";

export const HeroParallax = ({
  products,
}: {
  products: {
    title: string;
    thumbnail: string;
  }[];
}) => {
  const firstRow = products.slice(0, 5);
  const secondRow = products.slice(5, 10);
  const thirdRow = products.slice(10, 15);
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const springConfig = { stiffness: 300, damping: 30, bounce: 100 };

  const translateX = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, 1000]),
    springConfig,
  );
  const translateXReverse = useSpring(
    useTransform(scrollYProgress, [0, 1], [0, -1000]),
    springConfig,
  );
  const rotateX = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [15, 0]),
    springConfig,
  );
  const opacity = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [0.2, 1]),
    springConfig,
  );
  const rotateZ = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [20, 0]),
    springConfig,
  );
  const translateY = useSpring(
    useTransform(scrollYProgress, [0, 0.2], [-700, 500]),
    springConfig,
  );
  return (
    <MaxWidthWrapper>
      <div
        ref={ref}
        className="relative -mx-20 flex flex-col self-auto overflow-hidden py-40 antialiased  [transform-style:preserve-3d]"
      >
        <HeroTriangle />
        <Header />
        <NewsletterForm />
        <div className="relative">
          <div
            className="absolute inset-0 hidden bg-cover bg-center opacity-30 lg:block"
            style={{ backgroundImage: "url('/logo.svg')" }}
          ></div>
          <motion.div
            style={{
              rotateX,
              rotateZ,
              translateY,
              opacity,
            }}
            className="relative"
          >
            {/* <motion.div className="relative bottom-16">
        </motion.div> */}

            <motion.div className="relative bottom-96 mb-20 flex flex-row-reverse space-x-20 space-x-reverse">
              {firstRow.map((product) => (
                <ProductCard
                  product={product}
                  translate={translateX}
                  key={product.title}
                />
              ))}
            </motion.div>
            <motion.div className="relative bottom-96 mb-20 flex  flex-row space-x-20 ">
              {secondRow.map((product) => (
                <ProductCard
                  product={product}
                  translate={translateXReverse}
                  key={product.title}
                />
              ))}
            </motion.div>
            {/* <motion.div className="flex flex-row-reverse space-x-20 space-x-reverse">
            {thirdRow.map((product) => (
              <ProductCard
                product={product}
                translate={translateX}
                key={product.title}
              />
            ))}
          </motion.div> */}
          </motion.div>
        </div>
      </div>
    </MaxWidthWrapper>
  );
};

export const Header = () => {
  const t = useScopedI18n("hero");
  return (
    <div className="relative left-0 top-0 mx-auto w-full max-w-7xl px-4 py-20 md:pb-36 md:pt-20 flex flex-col lg:flex-row items-center justify-between gap-10">
      <div className="flex-1 max-w-2xl">
        <h1 className="text-headings text-3xl font-black md:text-7xl tracking-tight">
          <span className="inline-flex items-center gap-2 text-base font-bold tracking-[0.2em] uppercase text-primary mb-3">
            <span className="h-px w-6 bg-primary" />
            {t("welcomeLine1")}
          </span>
          <span className="block mt-1">
            {t("welcomeLine2")}
          </span>
        </h1>
        <p className="mt-6 max-w-xl text-base text-slate-600 dark:text-slate-300 md:text-lg leading-relaxed">
          {t("welcomeSubtitle")}
        </p>
      </div>

      {/* Top Right Corner Image */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative shrink-0 w-72 sm:w-80 md:w-96 rounded-3xl overflow-hidden shadow-2xl shadow-primary/20 border-2 border-primary/30 group bg-card"
      >
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <Image
            src="/image/hero-karate-kid.jpg"
            alt="HSTU Karate Dojo Training"
            fill
            className="object-cover object-top group-hover:scale-105 transition-transform duration-700"
            priority
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
          
          {/* Floating badge */}
          <div className="absolute bottom-4 left-4 right-4 backdrop-blur-md bg-black/40 border border-white/20 rounded-2xl p-3 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-primary">Youth Training</p>
                <p className="text-xs font-semibold text-white/90">Building Character & Excellence</p>
              </div>
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export const ProductCard = ({
  product,
  translate,
}: {
  product: {
    title: string;
    thumbnail: string;
  };
  translate: MotionValue<number>;
}) => {
  return (
    <motion.div
      style={{
        x: translate,
      }}
      whileHover={{
        y: -20,
      }}
      key={product.title}
      className="group/product relative h-96 w-[30rem] flex-shrink-0 cursor-default"
    >
      <div className="block">
        <Image
          src={product.thumbnail}
          height="600"
          width="600"
          className="absolute inset-0 h-full w-full rounded-lg object-cover object-center shadow-lg"
          alt={product.title}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 h-full w-full rounded-lg bg-black opacity-0 transition-opacity duration-300 group-hover/product:opacity-60"></div>
      <h2 className="absolute bottom-4 left-4 text-lg font-semibold text-white opacity-0 transition-opacity duration-300 group-hover/product:opacity-100">
        {product.title}
      </h2>
    </motion.div>
  );
};
