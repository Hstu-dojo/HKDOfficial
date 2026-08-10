"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useScopedI18n, useCurrentLocale } from "@/locales/client";
import { SectionHeader } from "./section-header";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ExternalLink, ShieldCheck } from "lucide-react";

export default function SectionPartners() {
  const t = useScopedI18n("homepage.partners");
  const locale = useCurrentLocale();

  const partnerList = [
    {
      name: "HSTU",
      fullName: "Hajee Mohammad Danesh Science & Technology University",
      logo: "/image/hstu.png",
      role: "Host University & Primary Support",
    },
    {
      name: "SDCH",
      fullName: "Physical Education & Sports Dept.",
      logo: "/image/sdch.jpg",
      role: "Training Partner & Facility Provider",
    },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-muted/10 via-background to-muted/10 overflow-hidden border-t border-border/40">
      {/* Subtle background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <SectionHeader
          kicker="Affiliations"
          title="Our Trusted"
          titleAccent="Partners"
          description={t("description")}
        />

        {/* Interactive Partner Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-14">
          {partnerList.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="group relative h-full bg-card/60 border border-border/60 hover:border-primary/40 rounded-3xl p-6 md:p-8 transition-all duration-500 hover:shadow-xl hover:shadow-primary/5 backdrop-blur-sm flex items-center gap-6">
                <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-2xl bg-white dark:bg-slate-900 p-3 shadow-md border border-border/50 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  <Image
                    src={partner.logo}
                    alt={partner.name}
                    width={90}
                    height={90}
                    className="object-contain max-h-full"
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary mb-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Official Affiliate</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                    {partner.name}
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                    {partner.fullName}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Prospectus CTA Banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-card via-muted/40 to-card border border-border/60 p-8 md:p-10 shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="h-7 w-7" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-foreground mb-1">
                  Dojo Prospectus & Guidelines
                </h4>
                <p className="text-sm text-muted-foreground max-w-lg">
                  Explore our official curriculum, belt requirements, training schedule, and dojo rules.
                </p>
              </div>
            </div>

            <Link href={`/${locale}/prospectus`} className="shrink-0 w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto rounded-full px-7 font-semibold gap-2 shadow-md">
                <span>View Prospectus</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
