import { Roboto } from "next/font/google";
import BackToTop from "@/components/back-to-top";
import React from "react";
import Header from "@/components/layout/header";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <body className={`${roboto.className} `}>
      <Header />
      <div className="mt-16 md:mt-20">{children}</div>
      <BackToTop />
    </body>
  );
}
