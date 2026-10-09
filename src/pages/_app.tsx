import { useEffect } from "react";
import type { AppProps } from "next/app";
import { Analytics } from "@vercel/analytics/next";
import "../styles/index.css";
import { ThemeProvider } from "@/context/ThemeProvider";
import { editorialFonts } from "@/styles/fonts";

export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    document.documentElement.classList.add(...editorialFonts.split(" "));
  }, []);
  return (
    <>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <div className={`${editorialFonts} editorial-site editorial-reference`}>
          <Component {...pageProps} />
        </div>
      </ThemeProvider>
      <Analytics />
    </>
  );
}
