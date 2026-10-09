"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  kicker: string;
  title: string;
  titleAccent?: string;
  description?: string;
  align?: "center" | "left";
  className?: string;
  lightText?: boolean;
}

export function SectionHeader({
  kicker,
  title,
  titleAccent,
  description,
  align = "center",
  className,
  lightText = false,
}: SectionHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "mb-10 md:mb-14",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 text-xs font-medium tracking-[0.15em] uppercase mb-5",
          lightText ? "text-white/65" : "text-muted-foreground",
          align === "center" ? "justify-center" : "justify-start"
        )}
      >
        <span className="h-px w-6 bg-primary" />
        {kicker}
        {align === "center" && <span className="h-px w-6 bg-primary" />}
      </span>
      <h2
        className={cn(
          "text-3xl md:text-5xl font-normal tracking-tight mb-4 leading-[1.15]",
          lightText ? "text-white" : "text-foreground"
        )}
      >
        {title}{" "}
        {titleAccent && (
          <span className="text-primary italic">
            {titleAccent}
          </span>
        )}
      </h2>
      {description && (
        <p
          className={cn(
            "text-lg max-w-xl leading-relaxed",
            lightText ? "text-slate-300" : "text-muted-foreground",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </motion.div>
  );
}
