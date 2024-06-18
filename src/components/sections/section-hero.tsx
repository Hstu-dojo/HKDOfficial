import HeroTriangle from "@/components/hero-triangle";
import NewsletterForm from "@/components/forms/newsletter-form";
import MaxWidthWrapper from "../maxWidthWrapper";

const SectionHero = () => {
  return (
    <MaxWidthWrapper className="relative overflow-hidden">
      <HeroTriangle />
      <section className="pb-16 pt-32 md:pt-40 lg:pb-40 lg:pt-60">
        <div className="container max-w-6xl">
          <div className="flex">
            <div className="lg:w-[45%]">
              <h1 className="text-headings max-w-xs text-3xl lg:text-4xl">
                Welcome to HSTU Karate Dojo
              </h1>
              <p className="mb-12 text-lg text-slate-700 dark:text-slate-300">
                Discover the art of karate at Hajee Mohammad Dahesh Science &
                Technology University. Join us for rigorous training, community
                engagement, and competitive success.
              </p>
            </div>
          </div>

          <NewsletterForm />
        </div>
      </section>
    </MaxWidthWrapper>
  );
};

export default SectionHero;
