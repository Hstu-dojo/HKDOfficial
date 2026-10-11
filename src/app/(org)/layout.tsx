import React from "react";
import { ThemeProvider } from "@/context/ThemeProvider";
import { editorialFonts } from "@/styles/fonts";
import { EditorialMotion } from "@/components/layout/editorial-motion";
import { AuthProvider } from "@/context/AuthContext";

import "@/styles/org-globals.css";

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      data-theme="editorial"
      className={`${editorialFonts} editorial-site editorial-public editorial-org min-h-screen bg-background text-foreground antialiased`}
    >
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <EditorialMotion>{children}</EditorialMotion>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}
