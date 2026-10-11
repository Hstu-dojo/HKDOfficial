"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import MaxWidthWrapper from "../maxWidthWrapper";
import { useScopedI18n } from "@/locales/client";
import { SectionHeader } from "./section-header";

export interface BranchData {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  description: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  heroTagline: string | null;
  yearEstablished: number | null;
  memberCount: number;
  courseCount: number;
}

const fadeUp = {
  initial: { opacity: 0, y: 40 },
  animate: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

interface SectionBranchesProps {
  branches: BranchData[];
  showHeading?: boolean;
}

const SectionBranches = ({
  branches,
  showHeading = true,
}: SectionBranchesProps) => {
  const t = useScopedI18n("homepage.branches");
  const [visible, setVisible] = useState(false);

  // Intersection observer via callback ref
  const observerRef = useRef<IntersectionObserver | null>(null);
  const setRef = (node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (node) {
      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setVisible(true);
        },
        { threshold: 0.1 },
      );
      observerRef.current.observe(node);
    }
  };

  if (branches.length === 0) return null;

  return (
    <section
      ref={setRef}
      id="branches"
      className="relative overflow-hidden bg-background py-20 lg:py-32"
    >
      <MaxWidthWrapper className="container relative z-10">
        {showHeading && (
          <SectionHeader
            kicker={t("kicker")}
            title={t("titlePrefix")}
            titleAccent={t("titleAccent")}
            description={t("description")}
          />
        )}

        {/* Branch cards grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          <AnimatePresence>
            {branches.map((branch, i) => (
              <motion.div
                key={branch.id}
                variants={fadeUp}
                initial="initial"
                animate={visible ? "animate" : "initial"}
                custom={i}
              >
                <Link href={`/org/${branch.slug}`}>
                  <div className="editorial-image group relative h-full overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-500 hover:border-primary/30 hover:shadow-sm dark:border-border/50 dark:hover:border-primary/30">
                    {/* Image section */}
                    <div className="relative h-48 overflow-hidden lg:h-56">
                      {branch.heroImageUrl ? (
                        <Image
                          src={branch.heroImageUrl}
                          alt={branch.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10">
                          <svg
                            className="h-16 w-16 text-primary/30"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />

                      {/* Logo badge */}
                      {branch.logoUrl && (
                        <div className="absolute left-3 top-3 h-10 w-10 rounded-lg border border-white/20 bg-white/90 p-1.5 shadow-lg backdrop-blur-sm dark:bg-background/90">
                          <Image
                            src={branch.logoUrl}
                            alt={`${branch.name} logo`}
                            fill
                            className="rounded-md object-contain"
                          />
                        </div>
                      )}

                      {/* Year badge */}
                      {branch.yearEstablished && (
                        <div className="absolute right-3 top-3">
                          <span className="rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm dark:bg-background/90 dark:text-muted-foreground">
                            Est. {branch.yearEstablished}
                          </span>
                        </div>
                      )}

                      {/* Stats floating on image */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                        {branch.memberCount > 0 && (
                          <div className="flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm dark:bg-background/90">
                            <svg
                              className="h-3.5 w-3.5 text-primary"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                              />
                            </svg>
                            <span className="text-[11px] font-semibold text-foreground dark:text-foreground">
                              {branch.memberCount}+
                            </span>
                          </div>
                        )}
                        {branch.courseCount > 0 && (
                          <div className="flex items-center gap-1.5 rounded-md bg-white/90 px-2.5 py-1 shadow-sm backdrop-blur-sm dark:bg-background/90">
                            <svg
                              className="h-3.5 w-3.5 text-secondary"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth={1.5}
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342"
                              />
                            </svg>
                            <span className="text-[11px] font-semibold text-foreground dark:text-foreground">
                              {branch.courseCount === 1
                                ? t("programCountOne", {
                                    count: branch.courseCount,
                                  })
                                : t("programCountMany", {
                                    count: branch.courseCount,
                                  })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 lg:p-6">
                      <h3 className="mb-1 line-clamp-1 text-lg font-bold transition-colors duration-300 group-hover:text-primary">
                        {branch.name}
                      </h3>

                      {branch.location && (
                        <div className="mb-3 flex items-center gap-1.5">
                          <svg
                            className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                            />
                          </svg>
                          <span className="truncate text-xs text-muted-foreground">
                            {branch.location}
                          </span>
                        </div>
                      )}

                      {(branch.heroTagline || branch.description) && (
                        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
                          {branch.heroTagline || branch.description}
                        </p>
                      )}

                      {/* Visit link */}
                      <div className="flex items-center gap-2 text-sm font-medium text-primary transition-all duration-300 group-hover:gap-3">
                        <span>{t("visitBranch")}</span>
                        <svg
                          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </div>
                    </div>

                    {/* Hover accent bar */}
                    <div className="absolute bottom-0 left-0 h-[3px] w-full origin-left scale-x-0 bg-muted from-primary to-tertiary transition-transform duration-500 group-hover:scale-x-100" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bottom line decoration */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={visible ? { scaleX: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-16 h-px origin-center bg-muted from-transparent via-primary/30 to-transparent"
        />
      </MaxWidthWrapper>
    </section>
  );
};

export default SectionBranches;
