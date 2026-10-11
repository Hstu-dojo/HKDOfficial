"use client";
import { motion, useReducedMotion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useScopedI18n, useCurrentLocale } from "@/locales/client";
import { Phone, Mail } from "lucide-react";
import { SectionHeader } from "./section-header";
import { faqCopy, type PublicFaq } from "@/lib/faqs/model";
const SectionFAQ = ({ faqs = [] }: { faqs?: PublicFaq[] }) => {
  const t = useScopedI18n("homepage.faq"),
    locale = useCurrentLocale(),
    reduced = useReducedMotion();
  const midpoint = Math.ceil(faqs.length / 2);
  const columns =
    faqs.length > 1 ? [faqs.slice(0, midpoint), faqs.slice(midpoint)] : [faqs];
  return (
    <section className="relative overflow-hidden bg-muted/50 py-16 md:py-24">
      <div className="container relative z-10 mx-auto">
        <SectionHeader
          kicker={t("kicker")}
          title={t("titlePrefix")}
          titleAccent={t("titleAccent")}
          description={t("subtitle")}
          align="left"
          className="mb-8 md:mb-10"
        />
        {!!faqs.length && (
          <div
            className={`grid items-start gap-x-10 ${columns.length > 1 ? "lg:grid-cols-2" : ""}`}
          >
            {columns.map((items, column) => (
              <motion.div
                key={column}
                initial={reduced ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: column * 0.08 }}
                className="min-w-0"
              >
                <Accordion
                  type="single"
                  collapsible
                  className="w-full border-t border-border"
                >
                  {items.map((item) => {
                    const copy = faqCopy(item.translations, locale);
                    return (
                      <AccordionItem
                        key={item.id}
                        value={item.id}
                        className="border-b border-border"
                      >
                        <AccordionTrigger className="gap-4 py-5 text-left text-base font-medium leading-relaxed hover:text-primary hover:no-underline md:text-lg [&>svg]:shrink-0">
                          <span className="min-w-0 break-words">
                            {copy.question}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent className="whitespace-pre-line break-words pb-6 pr-6 text-sm leading-relaxed text-muted-foreground md:text-base">
                          {copy.answer}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </motion.div>
            ))}
          </div>
        )}
        <div className="mt-8 flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h3 className="text-xl font-normal">{t("stillHaveQuestions")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("helpDescription")}
            </p>
          </div>
          <div className="flex min-w-0 flex-col gap-4 text-sm sm:flex-row sm:flex-wrap sm:gap-6">
            <a
              href="mailto:kaizen@paradox-bd.com"
              className="inline-flex min-w-0 items-center gap-2 transition-colors hover:text-primary"
            >
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <span className="break-all">kaizen@paradox-bd.com</span>
            </a>
            <a
              href="tel:+8801777300309"
              className="inline-flex items-center gap-2 transition-colors hover:text-primary"
            >
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              +880 1777-300309
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
export default SectionFAQ;
