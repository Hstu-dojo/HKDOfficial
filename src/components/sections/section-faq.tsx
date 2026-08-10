"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScopedI18n } from "@/locales/client";
import { MessageCircle } from "lucide-react";

const SectionFAQ = () => {
  const t = useScopedI18n("homepage.faq");

  const accordionItems = [
    { title: t("q1"), content: t("a1") },
    { title: t("q2"), content: t("a2") },
    { title: t("q3"), content: t("a3") },
  ];

  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-b from-muted/10 to-background overflow-hidden">
      {/* Decorative blurred blob */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-3xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4">
            <span className="h-px w-6 bg-primary" />
            FAQ
            <span className="h-px w-6 bg-primary" />
          </span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            {t("title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            {t("subtitle")}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <Accordion type="single" collapsible className="w-full space-y-3">
            {accordionItems.map((item, index) => (
              <AccordionItem
                key={index}
                value={item.title}
                className="border border-border/60 rounded-2xl px-6 bg-card/50 backdrop-blur-sm data-[state=open]:border-primary/30 data-[state=open]:shadow-sm transition-all duration-300"
              >
                <AccordionTrigger className="text-base font-semibold py-5 hover:no-underline text-left">
                  {item.title}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {item.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Contact line */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-3 text-sm text-muted-foreground"
          >
            <MessageCircle className="h-4 w-4 text-primary shrink-0" />
            <span>
              {t("anyQuestion")}{" "}
              <a
                href="mailto:hstukarate@gmail.com"
                className="text-primary font-semibold hover:underline"
              >
                hstukarate@gmail.com
              </a>
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default SectionFAQ;
