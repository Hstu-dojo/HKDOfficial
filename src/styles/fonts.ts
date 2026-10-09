import localFont from "next/font/local";

const sans = localFont({
  src: [
    {
      path: "../assets/fonts/editorial/inter-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/editorial/inter-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "../assets/fonts/editorial/inter-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
    {
      path: "../assets/fonts/editorial/inter-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});
const serif = localFont({
  src: [
    {
      path: "../assets/fonts/editorial/pt-serif-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/editorial/pt-serif-700-normal.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "../assets/fonts/editorial/pt-serif-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-serif",
  display: "swap",
  preload: false,
});
const bengali = localFont({
  src: [
    {
      path: "../assets/fonts/editorial/noto-bengali-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/editorial/noto-bengali-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-bengali",
  display: "swap",
  preload: false,
});
const devanagari = localFont({
  src: [
    {
      path: "../assets/fonts/editorial/noto-devanagari-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../assets/fonts/editorial/noto-devanagari-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-devanagari",
  display: "swap",
  preload: false,
});

export const editorialFonts = `${sans.variable} ${serif.variable} ${bengali.variable} ${devanagari.variable}`;
