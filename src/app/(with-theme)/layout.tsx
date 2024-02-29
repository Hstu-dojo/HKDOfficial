import "../globals.css";
import React from "react";
import { ThemeProvider } from "@/context/ThemeProvider";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body className={`dark:bg-slate-850 dark:text-slate-200`}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </body>
  );
}
