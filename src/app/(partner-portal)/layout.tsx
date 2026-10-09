import "../globals.css";
import React from "react";
import { editorialFonts } from "@/styles/fonts";
import { EditorialMotion } from "@/components/layout/editorial-motion";
import { ThemeProvider } from "@/context/ThemeProvider";

export default function PartnerPortalRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${editorialFonts} editorial-site editorial-portal min-h-screen bg-background text-foreground`}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <EditorialMotion>{children}</EditorialMotion>
      </ThemeProvider>
    </div>
  );
}
