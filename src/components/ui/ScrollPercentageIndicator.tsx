"use client";
import { useEffect, useState } from "react";

const ScrollPercentageIndicator = ({ onThresholdReached }:any) => {
  const [scrollPercentage, setScrollPercentage] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const footerElement = document.getElementById("footer");
      if (!footerElement) return;

      const windowHeight =
        "innerHeight" in window
          ? window.innerHeight
          : document.documentElement.offsetHeight;

      const footerTop = footerElement.offsetTop;
      const footerHeight = footerElement.offsetHeight;

      const windowBottom = windowHeight + window.pageYOffset;
      const footerBottom = footerTop + footerHeight;

      const percentage =
        ((windowBottom - footerTop) / (footerHeight + windowHeight)) * 100;

      setScrollPercentage(percentage);
      if (percentage > 100) {
        onThresholdReached();
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [onThresholdReached]);

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        padding: "0.5rem",
        background: "#fff",
        border: "1px solid #ccc",
        borderRadius: "4px",
        boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)",
      }}
    >
      Scroll Percentage: {scrollPercentage.toFixed(2)}%
    </div>
  );
};

export default ScrollPercentageIndicator;
