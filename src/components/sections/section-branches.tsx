"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import MaxWidthWrapper from "../maxWidthWrapper";
import { useCurrentLocale } from "@/locales/client";

interface BranchData {
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

const SectionBranches = () => {
  const [branches, setBranches] = useState<BranchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const locale = useCurrentLocale();

  useEffect(() => {
    fetch("/api/partners")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBranches(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.15 }
    );
    obs.observe(sectionRef.current);
    return () => obs.disconnect();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-white dark:bg-slate-900">
        <MaxWidthWrapper className="container">
          <div className="flex justify-center">
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        </MaxWidthWrapper>
      </section>
    );
  }

  if (branches.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="branches"
      className="relative py-20 lg:py-32 bg-gradient-to-b from-white via-slate-50/80 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 overflow-hidden"
    >
      {/* Decorative grid lines */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute left-[15%] top-0 h-full w-px bg-slate-200/60 dark:bg-slate-700/30" />
        <div className="absolute left-[85%] top-0 h-full w-px bg-slate-200/60 dark:bg-slate-700/30" />
        <div className="absolute left-0 top-[50%] w-full h-px bg-slate-200/40 dark:bg-slate-700/20" />
      </div>

      {/* Background large text */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
        aria-hidden="true"
      >
        <span className="font-bold text-[20vw] lg:text-[14vw] text-slate-100 dark:text-slate-800/40 leading-none whitespace-nowrap">
          DOJO
        </span>
      </div>

      <MaxWidthWrapper className="container relative z-10">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={visible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16 lg:mb-20"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-primary" />
            <span className="text-xs font-semibold tracking-[0.25em] text-primary uppercase">
              Our Network
            </span>
            <div className="h-px w-8 bg-primary" />
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Training <span className="text-primary">Branches</span>
          </h2>
          <p className="text-base text-muted-foreground max-w-lg mx-auto">
            Discover our affiliated training venues across the region. Each branch upholds the same standard of excellence.
          </p>
        </motion.div>

        {/* Branch cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          <AnimatePresence>
            {branches.map((branch, i) => (
              <motion.div
                key={branch.id}
                variants={fadeUp}
                initial="initial"
                animate={visible ? "animate" : "initial"}
                custom={i}
                onMouseEnter={() => setHoveredId(branch.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <Link href={`/org/${branch.slug}`}>
                  <div className="group relative bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100 dark:border-slate-700/50 hover:border-primary/30 dark:hover:border-primary/30 h-full">
                    {/* Image section */}
                    <div className="relative h-48 lg:h-56 overflow-hidden">
                      {branch.heroImageUrl ? (
                        <Image
                          src={branch.heroImageUrl}
                          alt={branch.name}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10 flex items-center justify-center">
                          <svg
                            className="w-16 h-16 text-primary/30"
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

                      {/* Logo badge */}
                      {branch.logoUrl && (
                        <div className="absolute top-3 left-3 w-10 h-10 rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-1.5 shadow-lg border border-white/20">
                          <Image
                            src={branch.logoUrl}
                            alt={`${branch.name} logo`}
                            fill
                            className="object-contain rounded-md"
                          />
                        </div>
                      )}

                      {/* Year badge */}
                      {branch.yearEstablished && (
                        <div className="absolute top-3 right-3">
                          <span className="text-[10px] font-medium bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm text-slate-600 dark:text-slate-300 px-2 py-1 rounded-md shadow-sm">
                            Est. {branch.yearEstablished}
                          </span>
                        </div>
                      )}

                      {/* Stats floating on image */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-3">
                        {branch.memberCount > 0 && (
                          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-md px-2.5 py-1 shadow-sm">
                            <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                            </svg>
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                              {branch.memberCount}+
                            </span>
                          </div>
                        )}
                        {branch.courseCount > 0 && (
                          <div className="flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-md px-2.5 py-1 shadow-sm">
                            <svg className="w-3.5 h-3.5 text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                            </svg>
                            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                              {branch.courseCount} {branch.courseCount === 1 ? "program" : "programs"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="p-5 lg:p-6">
                      <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors duration-300 line-clamp-1">
                        {branch.name}
                      </h3>

                      {branch.location && (
                        <div className="flex items-center gap-1.5 mb-3">
                          <svg
                            className="w-3.5 h-3.5 text-muted-foreground shrink-0"
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
                          <span className="text-xs text-muted-foreground truncate">
                            {branch.location}
                          </span>
                        </div>
                      )}

                      {(branch.heroTagline || branch.description) && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {branch.heroTagline || branch.description}
                        </p>
                      )}

                      {/* Visit link */}
                      <div className="flex items-center gap-2 text-primary text-sm font-medium group-hover:gap-3 transition-all duration-300">
                        <span>Visit Branch</span>
                        <svg
                          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </div>
                    </div>

                    {/* Hover accent bar */}
                    <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary to-tertiary scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
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
          className="mt-16 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent origin-center"
        />
      </MaxWidthWrapper>
    </section>
  );
};

export default SectionBranches;
