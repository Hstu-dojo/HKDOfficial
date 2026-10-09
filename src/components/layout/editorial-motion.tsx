"use client";

import { MotionConfig } from "framer-motion";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Progressive enhancement: sections are visible before JS and in reduced motion. */
export function EditorialMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (
      !window.IntersectionObserver ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("editorial-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.06 },
    );
    document
      .querySelectorAll(
        ".editorial-public main > section:not([data-scroll-scene]), .editorial-public main > div > section:not([data-scroll-scene]), .editorial-blog article",
      )
      .forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <MotionConfig
      reducedMotion="user"
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionConfig>
  );
}
