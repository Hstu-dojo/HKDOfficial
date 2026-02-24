import React from "react";
import type { Metadata, Viewport } from "next";
import { Bebas_Neue, JetBrains_Mono } from "next/font/google";

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

export const metadata: Metadata = {
  title: {
    default: "Partner Organization | HKD",
    template: "%s | HKD Partner",
  },
};

export const viewport: Viewport = {
  themeColor: "#080808",
};

export default function OrgRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="brutalist" className={`${bebasNeue.variable} ${jetbrainsMono.variable}`}>
      <body className="font-body antialiased overflow-x-hidden bg-[hsl(0_0%_3%)] text-[hsl(0_0%_95%)]">
        {children}
      </body>
    </html>
  );
}
