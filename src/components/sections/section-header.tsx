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
        "mb-12 md:mb-16",
        align === "center" ? "text-center" : "text-left",
        className
      )}
    >
      <span
        className={cn(
          "inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4",
          align === "center" ? "justify-center" : "justify-start"
        )}
      >
        <span className="h-px w-6 bg-primary" />
        {kicker}
        {align === "center" && <span className="h-px w-6 bg-primary" />}
      </span>
      <h2
        className={cn(
          "text-3xl md:text-5xl font-black tracking-tight mb-4",
          lightText ? "text-white" : "text-foreground"
        )}
      >
        {title}{" "}
        {titleAccent && (
          <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
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
