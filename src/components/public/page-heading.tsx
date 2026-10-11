"use client";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
type Props = {
  title: React.ReactNode;
  accent?: React.ReactNode;
  kicker?: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  titleClasses?: string;
  descriptionClasses?: string;
};
export default function PublicPageHeading({
  title,
  accent,
  kicker,
  description,
  actions,
  children,
  className,
  titleClasses,
  descriptionClasses,
}: Props) {
  const reduced = useReducedMotion();
  return (
    <motion.header
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={cn("public-page-heading", className)}
    >
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div className="min-w-0 flex-1">
          {kicker && (
            <p className="mb-5 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              <span
                aria-hidden="true"
                className="h-px w-6 shrink-0 bg-primary"
              />
              {kicker}
            </p>
          )}
          <h1 className={cn("public-page-title", titleClasses)}>
            {title}
            {accent && (
              <>
                {" "}
                <span className="italic text-primary">{accent}</span>
              </>
            )}
          </h1>
          {description && (
            <p className={cn("public-page-description", descriptionClasses)}>
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex shrink-0 flex-wrap items-center gap-2 md:pt-1">
            {actions}
          </div>
        )}
      </div>
      {children && <div className="mt-6 flex flex-wrap gap-3">{children}</div>}
    </motion.header>
  );
}
