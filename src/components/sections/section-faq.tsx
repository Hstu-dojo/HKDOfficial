"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScopedI18n } from "@/locales/client";
import { MessageCircle, Phone, Mail, HelpCircle } from "lucide-react";
import { SectionHeader } from "./section-header";

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
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-violet-500/5 blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column — Header & Contact Info */}
          <div className="lg:col-span-5">
            <SectionHeader
              kicker="FAQ"
              title="Frequently Asked"
              titleAccent="Questions"
              description={t("subtitle")}
              align="left"
              className="mb-8 md:mb-8"
            />

            {/* Quick Contact Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-card to-muted/50 border border-border/60 shadow-sm relative overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Still Have Questions?</h3>
                  <p className="text-xs text-muted-foreground">We're here to help you get started</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/50 text-sm">
                <a
                  href="mailto:hstukarate@gmail.com"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <span>hstukarate@gmail.com</span>
                </a>
                <a
                  href="tel:+8801777-300309"
                  className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span>+880 1777-300309</span>
                </a>
              </div>
            </motion.div>
          </div>

          {/* Right Column — Accordion List */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7"
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {accordionItems.map((item, index) => (
                <AccordionItem
                  key={index}
                  value={item.title}
                  className="border border-border/60 rounded-2xl px-6 md:px-8 bg-card/60 backdrop-blur-sm data-[state=open]:border-primary/40 data-[state=open]:shadow-md transition-all duration-300"
                >
                  <AccordionTrigger className="text-base md:text-lg font-bold py-5 hover:no-underline text-left">
                    {item.title}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm md:text-base leading-relaxed pb-6 pt-1">
                    {item.content}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default SectionFAQ;
