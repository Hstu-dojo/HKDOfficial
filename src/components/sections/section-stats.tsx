"use client";

import { useI18n } from "@/locales/client";
import { motion } from "framer-motion";

const SectionStats = () => {
  const t = useI18n();

  const statistics = [
    {
      number: "200+",
      title: t("about.stats.activeMembers"),
    },
    {
      number: "15+",
      title: t("about.stats.championships"),
    },
    {
      number: "5+",
      title: "Years Active",
    },
    {
      number: "4",
      title: "Training Branches",
    },
  ];

  return (
    <section className="relative py-16 bg-foreground dark:bg-slate-800 text-background dark:text-white overflow-hidden">
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x lg:divide-background/20">
          {statistics.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center text-center lg:px-6"
            >
              <span className="text-4xl lg:text-5xl font-black mb-2 tracking-tight">
                {item.number}
              </span>
              <span className="text-sm font-medium text-background/70 dark:text-slate-400 uppercase tracking-wider">
                {item.title}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SectionStats;
