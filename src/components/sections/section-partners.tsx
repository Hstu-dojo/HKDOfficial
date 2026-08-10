"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useScopedI18n } from "@/locales/client";
import { SectionHeader } from "./section-header";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";

export default function SectionPartners() {
  const t = useScopedI18n("homepage.partners");

  const partnerList = [
    {
      name: "HSTU",
      fullName: "Hajee Mohammad Danesh Science & Technology University",
      logo: "/image/hstu.png",
      role: "Host University & Primary Support",
      isRound: false,
    },
    {
      name: "SDCH",
      fullName: "Physical Education & Sports Dept.",
      logo: "/image/sdch.jpg",
      role: "Training Partner & Facility Provider",
      isRound: false,
    },
    {
      name: "ECE Club",
      fullName: "ECE Club of HSTU",
      logo: "/image/ece-club.jpg",
      role: "Official Club Partner",
      isRound: true,
    },
  ];

  return (
    <section className="relative py-24 md:py-32 bg-slate-950 text-white overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-slate-950 before:via-slate-950/85 before:to-slate-950 before:z-[1]">
      {/* Background Map Image */}
      <Image
        src="/partners/map.png"
        alt="Partners World Map"
        fill
        className="object-cover object-center opacity-20 pointer-events-none"
      />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <SectionHeader
          kicker="Affiliations"
          title="Our Trusted"
          titleAccent="Partners"
          description={t("description")}
          lightText
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
              <div className="group relative h-full bg-slate-900/80 border border-slate-800 hover:border-primary/50 rounded-3xl p-6 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 backdrop-blur-md flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                <div
                  className={`relative w-20 h-20 shrink-0 bg-white p-2.5 shadow-lg border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 ${
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
                    <span>{partner.role}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-primary transition-colors">
                    {partner.name}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
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
          <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-8 md:p-10 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="h-14 w-14 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white mb-1">
                  Dojo Prospectus & Guidelines
                </h4>
                <p className="text-sm text-slate-300 max-w-lg">
                  Explore our official curriculum, belt requirements, training schedule, and dojo rules.
                </p>
              </div>
            </div>

            <Link href="/prospectus" className="shrink-0 w-full md:w-auto">
              <Button size="lg" className="w-full md:w-auto rounded-full px-7 font-semibold gap-2 shadow-lg">
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
