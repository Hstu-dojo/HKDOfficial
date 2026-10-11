import type { Metadata } from "next";
import { noIndex } from "@/lib/seo/site";
export const metadata: Metadata = { title: "Content studio", robots: noIndex };
export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
