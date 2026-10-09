import React from "react";
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
      <AuthProvider>
        <EditorialMotion>{children}</EditorialMotion>
      </AuthProvider>
    </div>
  );
}
