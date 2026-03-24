import React from "react";
import { Bebas_Neue, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";

import "@/styles/org-globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
});

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div
      data-theme="brutalist"
      className={`${bebasNeue.variable} ${jetbrainsMono.variable} font-body antialiased overflow-x-hidden`}
      style={{
        backgroundColor: "hsl(0 0% 3%)",
        color: "hsl(0 0% 95%)",
        minHeight: "100vh",
      }}
    >
      <AuthProvider>{children}</AuthProvider>
    </div>
  );
}
