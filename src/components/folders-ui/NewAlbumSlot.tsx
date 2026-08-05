"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";

interface NewAlbumSlotProps {
  onClick?: () => void;
  title?: string;
  subtitle?: string;
}

export function NewAlbumSlot({ 
  onClick, 
  title = "New Album", 
  subtitle = "Create Collection" 
}: NewAlbumSlotProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const fullText = "Click to start...";
  
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (isHovered) {
      setDisplayedText("");
      setIsTypingComplete(false);
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsTypingComplete(true);
        }
      }, 60);
      return () => clearInterval(interval);
    } else {
      setDisplayedText("");
      setIsTypingComplete(false);
    }
  }, [isHovered, fullText]);

  return (
    <div
      className="group relative w-[288px] mx-auto cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div
        className="relative w-[288px]"
        style={{ perspective: "1200px" }}
      >
        <div
          className="absolute inset-0 z-20 flex items-start justify-center px-6 pt-12 transition-opacity duration-300 pointer-events-none"
          style={{ opacity: isHovered ? 1 : 0 }}
        >
          <p
            className={`text-sm font-mono text-center ${isDark ? 'text-white/50' : 'text-black/50'}`}
            style={{
              lineHeight: "20px",
            }}
          >
            {displayedText}
            {isHovered && (
              <span
                className={`inline-block w-[2px] h-[14px] ml-0.5 ${isDark ? 'bg-white/50' : 'bg-black/50'}`}
                style={{
                  verticalAlign: "text-bottom",
                  animation: isTypingComplete ? "blink 1s step-end infinite" : "none",
                }}
              />
            )}
          </p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}} />

        <div
          className="relative z-0 rounded-2xl transition-all duration-500"
          style={{
            height: "224px",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
            transform: isHovered ? "rotateX(15deg)" : "rotateX(0deg)",
            background: isDark ? "#1e1e1e" : "#f8fafc",
            border: isDark ? "1px dashed rgba(255, 255, 255, 0.15)" : "1px dashed rgba(0, 0, 0, 0.15)",
          }}
        ></div>

        <div
          className="absolute bottom-0 left-0 right-0 z-10 rounded-2xl overflow-hidden transition-all duration-500"
          style={{
            background: isDark ? "rgba(26, 26, 26, 0.8)" : "rgba(255, 255, 255, 0.85)",
            border: isDark ? "1px dashed rgba(255, 255, 255, 0.15)" : "1px dashed rgba(0, 0, 0, 0.15)",
            backdropFilter: "blur(8px)",
            transformStyle: "preserve-3d",
            transformOrigin: "center bottom",
            transform: isHovered ? "rotateX(-25deg)" : "rotateX(0deg)",
          }}
        >
          <div className="relative py-4 px-4">
            <h3 className={`font-semibold text-base leading-snug line-clamp-2 min-h-[2.75rem] transition-colors duration-300 ${isDark ? 'text-white/70 group-hover:text-white' : 'text-black/70 group-hover:text-black'}`}>
              {title}
            </h3>
          </div>
          <div className="relative h-[48px]">
            <div className={`absolute inset-x-0 top-0 h-[1px] border-t border-dashed ${isDark ? 'border-white/[0.15]' : 'border-black/[0.15]'}`} />
            <div className="absolute inset-0 flex items-center justify-between px-4">
              <span className={`text-[13px] transition-colors duration-300 ${isDark ? 'text-white/40 group-hover:text-white/60' : 'text-black/40 group-hover:text-black/60'}`}>
                {subtitle}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
