"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useScopedI18n } from "@/locales/client";
import { SectionHeader } from "./section-header";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";

export default function SectionPartners() {
  const t = useScopedI18n("homepage.partners") as any;

  const partnerList = [
    {
      name: "HSTU",
      fullNameKey: "organizations.hstu",
      logo: "/image/hstu.png",
      roleKey: "roles.hstu",
      isRound: false,
    },
    {
      name: "SDCH",
      fullNameKey: "organizations.sdch",
      logo: "/image/sdch.jpg",
      roleKey: "roles.sdch",
      isRound: false,
    },
    {
      name: "ECE Club",
      fullNameKey: "organizations.ece",
      logo: "/image/ece-club.jpg",
      roleKey: "roles.ece",
      isRound: true,
    },
  ];

  return (
    <section className="relative overflow-hidden bg-background py-24 text-foreground md:py-32">
      {/* Background Map Image */}
      <Image
        src="/partners/map.png"
          alt={t("title")}
        fill
        className="object-cover object-center opacity-20 pointer-events-none"
      />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <SectionHeader
          kicker={t("kicker")}
          title={t("titlePrefix")}
          titleAccent={t("titleAccent")}
          description={t("description")}
        />

        {/* Interactive Partner Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-14">
          {partnerList.map((partner, index) => (
            <motion.div
              key={partner.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
            >
              <div className="group relative flex h-full flex-col items-center gap-5 rounded-3xl border border-border/70 bg-card/85 p-6 text-center backdrop-blur-md transition-all duration-500 hover:border-primary/45 hover:shadow-sm sm:flex-row sm:text-left">
                <div
                  className={`relative w-20 h-20 shrink-0 bg-white p-2.5 shadow-lg border border-white/20 flex items-center justify-center group-hover:scale-[1.025] transition-transform duration-500 ${
                    partner.isRound ? "rounded-full overflow-hidden" : "rounded-2xl"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className={`max-h-full max-w-full object-contain ${
                      partner.isRound ? "rounded-full scale-110" : ""
                    }`}
                  />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-primary mb-1">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{t(partner.roleKey)}</span>
                  </div>
                  <h3 className="mb-1 text-lg font-bold text-foreground transition-colors group-hover:text-primary">
                    {partner.name}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {t(partner.fullNameKey)}
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
          <div className="relative flex flex-col items-center justify-between gap-6 overflow-hidden rounded-3xl border border-border/70 bg-card p-8 shadow-sm backdrop-blur-md md:flex-row md:p-10">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h4 className="mb-1 text-xl font-bold text-foreground">
                  {t("prospectusTitle")}
                </h4>
                <p className="max-w-lg text-sm text-muted-foreground">
                  {t("prospectusDescription")}
                </p>
              </div>
            </div>

            <Link href="/prospectus" className="shrink-0 w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto rounded-full px-7 font-semibold gap-2 shadow-lg">
                <span>{t("viewProspectus")}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
