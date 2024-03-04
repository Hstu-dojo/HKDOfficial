"use client";
import { TypewriterEffect } from "@/components/ui/typewriter-effect";

export default function TypewriterEffectComponent({ text }: { text?: string }) {
  // Check if text is defined, otherwise set it to an empty string
  const words = (text || "").split(" ").map((word, index, array) => ({
    text: word,
    className:
      index === array.length - 1 ? "text-primary dark:text-primary" : "",
  }));

  return <TypewriterEffect words={words} />;
}
