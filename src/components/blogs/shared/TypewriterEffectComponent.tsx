"use client";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";

export default function TypewriterEffectComponent({ text }: { text?: string }) {
  // Check if text is defined, otherwise set it to an empty string
  const words = (text || "").split(" ").map((word, index, array) => ({
    text: word,
    className: index === array.length - 1 ? "text-blue-500 dark:text-blue-500" : "",
  }));

  return <TypewriterEffect words={words} />;
}
