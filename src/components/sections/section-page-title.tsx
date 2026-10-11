"use client";
import PublicPageHeading from "@/components/public/page-heading";
type SectionPageTitleProps = {
  children: React.ReactNode;
  subtitle?: string;
  kicker?: string;
  titleClasses?: string;
  subtitleClasses?: string;
};
export default function SectionPageTitle({
  children,
  subtitle,
  kicker,
  titleClasses,
  subtitleClasses,
}: SectionPageTitleProps) {
  return (
    <section className="public-page-masthead">
      <div className="public-page-container">
        <PublicPageHeading
          title={children}
          kicker={kicker}
          description={subtitle}
          titleClasses={titleClasses}
          descriptionClasses={subtitleClasses}
        />
      </div>
    </section>
  );
}
