"use client";

import { useI18n } from "@/locales/client";
import { CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const SectionChecklist = () => {
  const t = useI18n();

  const leftFeatures = [
    t("about.features.established"),
    t("about.features.discipline"),
    t("about.features.instructors"),
  ];

  const rightFeatures = [
    t("about.features.championships"),
    t("about.features.community"),
    t("about.features.environment"),
  ];

  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="rounded-3xl bg-card border border-border/60 p-8 md:p-12 shadow-xl shadow-black/5 dark:bg-slate-900/80 backdrop-blur-sm"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
            {t("about.keyFeatures")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {leftFeatures.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-base text-foreground/90 leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-4">
              {rightFeatures.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-base text-foreground/90 leading-snug">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SectionChecklist;
