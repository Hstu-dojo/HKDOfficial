"use client";
import { motion } from "framer-motion";

import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import MaxWidthWrapper from "../maxWidthWrapper";
import { Helmet } from "react-helmet";
import { useScopedI18n } from "@/locales/client";

const SectionFAQ = () => {
    const t = useScopedI18n("homepage.faq");
    const accordionItems = [
      {
        title: t('q1'),
        content: t('a1'),
      },
      {
        title: t('q2'),
        content: t('a2'),
      },
      {
        title: t('q3'),
        content: t('a3'),
      },
    ];

  return (
    <section className="relative overflow-hidden py-24 dark:bg-slate-900 lg:py-32">
      <MaxWidthWrapper className="container">
        <div className="flex flex-wrap items-center justify-between lg:flex-nowrap">
          <div className="lg:w-[45%] lg:pr-10">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.5,
              }}
            >
              <h2>{t('title')}</h2>
              <p className="mb-8 text-lg">
                {t('subtitle')}
              </p>
              <Accordion
                type="single"
                // defaultValue={[accordionItems[0].title]}
                className="w-full"
              >
                {accordionItems?.map((item, index) => (
                  <AccordionItem key={index} value={item.title}>
                    <AccordionTrigger className="text-md">
                      {item.title}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="flex flex-col space-y-2">
                        {item.content}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
                {/* <AccordionItem key="ai" value="ai">
                  <AccordionTrigger className="text-md">
                    Ask more to HKD AI
                  </AccordionTrigger>
                  <AccordionContent>
                    <div
                      className="flex flex-col space-y-2 filter dark:invert"
                      id="chatling-inline-bot"
                      style={{ width: "100%", height: "500px" }}
                    ></div>
                    <Helmet>
                      <script
                        async
                        data-id="2546634911"
                        data-display="page_inline"
                        id="chatling-embed-script"
                        type="text/javascript"
                        src="https://chatling.ai/js/embed.js"
                      ></script>
                    </Helmet>
                  </AccordionContent>
                </AccordionItem> */}
              </Accordion>
              <span className="mt-14 inline-block text-lg">
                {t('anyQuestion')}{" "}
                <a href="mailto:hstukarate@gmail.com" className="text-primary">
                  hstukarate@gmail.com
                </a>
              </span>
            </motion.div>
          </div>

          <div className="relative z-[1] mb-10 lg:w-1/2">
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: 0.5,
              }}
            >
              <Image
                src="/circles_pattern_2.png"
                alt="circles pattern"
                width={526}
                height={531}
                className="absolute right-10 top-4 -z-[1] -translate-y-8 scale-110 dark:opacity-10"
              />
              <div className="mt-12 md:flex md:space-x-8 lg:justify-end">
                <Image
                  src="/image/kata-prc.jpg"
                  alt="HSTU Karate Dojo"
                  width={320}
                  height={320}
                  className="mb-8 inline-block rounded-xl"
                />
                <div className="relative mb-8 max-w-[13.125rem] self-end rounded-xl bg-white bg-gradient-to-b from-secondary/70 to-quaternary/70 p-8 shadow-lg">
                  <span className="mb-4 block text-base font-semibold text-white">
                    Members Trained
                  </span>
                  <span className="mb-4 block text-3xl font-bold text-white">
                    150+
                  </span>
                  <span className="block text-base text-white">Since 2022</span>
                </div>
              </div>
              <div className="relative">
                <div className="relative mx-auto max-w-xs self-start rounded-xl bg-white bg-gradient-to-l from-primary/70 to-tertiary/70 p-8 shadow-lg">
                  <div className="absolute right-8 top-8 rounded-full bg-white p-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="24"
                      height="24"
                      className="fill-primary"
                    >
                      <path fill="none" d="M0 0h24v24H0z"></path>
                      <path d="M4.406 14.523l3.402-3.402 2.828 2.829 3.157-3.157L12 9h5v5l-1.793-1.793-4.571 4.571-2.828-2.828-2.475 2.474a8 8 0 1 0-.927-1.9zm-1.538 1.558l-.01-.01.004-.004A9.965 9.965 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10c-4.07 0-7.57-2.43-9.132-5.919z"></path>
                    </svg>
                  </div>

                  <div className="text-left">
                    <span className="mb-4 block text-base font-semibold text-white">
                      Competitions Participated
                    </span>
                    <span className="mb-4 block text-3xl font-bold text-white">
                      10+
                    </span>
                    <span className="block text-base text-white">
                      Intra and inter-university
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </MaxWidthWrapper>
    </section>
  );
};

export default SectionFAQ;
