import "../globals.css";
import React from "react";
import { ThemeProvider } from "@/context/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body className={`min-w-[350px] overflow-x-scroll dark:bg-slate-850 dark:text-slate-200`}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </AuthProvider>
    </body>
  );
}
