import "../globals.css";
import React from "react";
import { editorialFonts } from "@/styles/fonts";
import { EditorialMotion } from "@/components/layout/editorial-motion";
import { ThemeProvider } from "@/context/ThemeProvider";
import { Toaster } from "sonner";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // get next theme color
  return (
    <div
      className={`${editorialFonts} editorial-site editorial-public editorial-blog`}
      lang="en"
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <EditorialMotion>{children}</EditorialMotion>
      </ThemeProvider>
      <Toaster richColors />
    </div>
  );
}
