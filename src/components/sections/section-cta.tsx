"use client";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import PwaInstall from "@/components/sections/pwa-install";
import MaxWidthWrapper from "../maxWidthWrapper";

const SectionCTA = () => {
  return (
    <MaxWidthWrapper>
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{
          delay: 0.5,
        }}
      >
        <div className="container relative z-10 -mt-36">
          <div className="mx-auto max-w-6xl">
            <div className="rounded-md bg-muted px-6 py-24 text-center shadow-lg dark:bg-slate-800 dark:shadow-slate-850/20">
              <h2 className="mb-8">
                Karate is not about fighting, it&apos;s a lifestyle!
              </h2>
              <div className="flex w-full flex-col items-center justify-center gap-2 md:flex-row lg:gap-3">
                <PwaInstall />
                <Button size="lg">Let’s Join You</Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </MaxWidthWrapper>
  );
};

export default SectionCTA;
