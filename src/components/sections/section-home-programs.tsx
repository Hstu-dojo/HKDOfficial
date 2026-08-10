"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { useCurrentLocale, useScopedI18n } from "@/locales/client";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "./section-header";

const SectionHomePrograms = () => {
  const locale = useCurrentLocale();
  const t = useScopedI18n("homepage.programs");

  const programs = [
    {
      icon: "/gif/1797-stretching.gif",
      title: t("training.title"),
      description: t("training.description"),
      href: "/karate/courses",
      gradient: "from-violet-600/20 via-purple-500/10 to-transparent",
      accentColor: "from-violet-500 to-purple-600",
      span: "md:col-span-2",
    },
    {
      icon: "/gif/660-karate-fight (1).gif",
      title: t("events.title"),
      description: t("events.description"),
      href: "/karate/programs",
      gradient: "from-rose-600/20 via-orange-500/10 to-transparent",
      accentColor: "from-rose-500 to-orange-500",
      span: "",
    },
    {
      icon: "/gif/1022-podium-conference.gif",
      title: t("join.title"),
      description: t("join.description"),
      href: "/onboarding",
      gradient: "from-cyan-600/20 via-sky-500/10 to-transparent",
      accentColor: "from-cyan-500 to-sky-600",
      span: "md:col-span-2",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-muted/5 to-background relative overflow-hidden">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <SectionHeader
          kicker="What We Offer"
          title="Discover Our"
          titleAccent="Programs"
          description="Comprehensive martial arts training designed for practitioners of all ages and skill levels."
        />

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
          {programs.map((program, i) => (
            <motion.div
              key={program.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.55,
                delay: i * 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={program.span}
            >
              <Link href={`/${locale}${program.href}`} className="group block h-full">
                <div
                  className={`relative h-full min-h-[220px] overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br ${program.gradient} backdrop-blur-sm p-7 md:p-8 transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1`}
                >
                  {/* Ambient glow */}
                  <div className={`absolute -top-12 -right-12 w-40 h-40 rounded-full bg-gradient-to-br ${program.accentColor} opacity-10 blur-3xl group-hover:opacity-20 transition-opacity duration-500`} />

                  {/* GIF Icon */}
                  <div className="absolute top-6 right-6 w-16 h-16 md:w-20 md:h-20 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={program.icon}
                      alt={program.title}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 mt-auto flex flex-col h-full justify-end">
                    <h3 className="text-xl md:text-2xl font-bold mb-2 leading-tight">
                      {program.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 max-w-xs">
                      {program.description}
                    </p>
                    <div className={`inline-flex items-center gap-2 text-sm font-semibold bg-gradient-to-r ${program.accentColor} bg-clip-text text-transparent group-hover:gap-3 transition-all duration-300`}>
                      Explore
                      <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform duration-300" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionHomePrograms;
