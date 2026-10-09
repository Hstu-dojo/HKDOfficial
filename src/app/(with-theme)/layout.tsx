import "../globals.css";
import React from "react";
import { editorialFonts } from "@/styles/fonts";
import { EditorialMotion } from "@/components/layout/editorial-motion";
import { ThemeProvider } from "@/context/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${editorialFonts} editorial-site min-h-screen bg-background text-foreground`}
    >
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <EditorialMotion>{children}</EditorialMotion>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}
