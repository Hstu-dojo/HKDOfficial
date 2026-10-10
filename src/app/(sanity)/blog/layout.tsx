import { Navbar } from "@/components/blogs/global/Navbar";
import { Footer } from "@/components/blogs/global/Footer";
import "./index.css";
import BackToTop from "@/components/back-to-top";
import { toPlainText } from "@portabletext/react";
import { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { draftMode } from "next/headers";
import { Suspense } from "react";
import {
  loadHomePage,
  loadSettings,
} from "../../../../sanity/loader/loadQuery";
import { urlForOpenGraphImage } from "../../../../sanity/lib/utils";
import ChatPlugin from "@/components/chat";
import SkeletonCard from "./loading";
import GNewsRevManager from "@/components/GNewsRevManager";

const LiveVisualEditing = dynamic(
  () => import("@/components/blogs/LiveVisualEditing"),
);

export async function generateMetadata(): Promise<Metadata> {
  const [{ data: settings }, { data: homePage }] = await Promise.all([
    loadSettings(),
    loadHomePage(),
  ]);

  const ogImage = urlForOpenGraphImage(settings?.ogImage);
  return {
    title: homePage?.title
      ? {
          template: `%s | ${homePage.title}`,
          default: homePage.title || "Personal website",
        }
      : undefined,
    description: homePage?.overview
      ? toPlainText(homePage.overview)
      : undefined,
    openGraph: {
      images: ogImage ? [ogImage] : [],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#f8f7fa",
};

export default async function IndexRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Suspense>
          <Navbar />
        </Suspense>
        <main className="journal-container journal-main" id="journal-content">
          <Suspense fallback={<SkeletonCard />}>{children}</Suspense>
        </main>
        <Suspense>
          <Footer />
        </Suspense>
      </div>
      <BackToTop />
      <ChatPlugin />
      <GNewsRevManager />
      {(await draftMode()).isEnabled && <LiveVisualEditing />}
    </>
  );
}
