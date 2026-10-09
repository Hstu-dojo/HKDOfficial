"use client";

import { motion } from "framer-motion";
import React from "react";

import { useSession } from "@/hooks/useSessionCompat";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuroraBd() {
  const callbackUrl = usePathname();
  console.log(callbackUrl);
  const { data: session } = useSession();
  return (
    <section className="border-b border-border bg-muted px-4 pb-12 pt-32 text-foreground">
      <motion.div
        initial={{ opacity: 0.0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: "easeInOut",
        }}
        className="relative flex flex-col items-center justify-center gap-4 px-4"
      >
        <div className="text-center font-serif text-3xl font-normal md:text-5xl">
          One more step to your dream DOJO.
        </div>
        <div className="py-3 text-base text-muted-foreground md:text-lg">
          Fill following info caoutiously.
        </div>
        {!session?.user?.email && (
          <Link href={`/login?callbackUrl=${callbackUrl}`}>
            <button className="w-fit rounded-full bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
              Login now
            </button>
          </Link>
        )}
      </motion.div>
    </section>
  );
}
