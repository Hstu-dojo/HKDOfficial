
import BackToTop from "@/components/back-to-top";
import React from "react";
import Header from "@/components/layout/header";
import { draftMode } from "next/headers";
import LiveVisualEditing from "@/components/blogs/LiveVisualEditing";
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // get next theme color
  return (
    <div className="editorial-public">
      <Header />
      <div className="mt-24 text-foreground">
        {children}
        {(await draftMode()).isEnabled && <LiveVisualEditing />}
      </div>
      <BackToTop />
    </div>
  );
}
