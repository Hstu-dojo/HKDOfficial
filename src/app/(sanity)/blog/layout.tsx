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
  themeColor: "#000",
};

export default async function IndexRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="flex min-h-screen flex-col bg-white text-black">
        <Suspense>
          <Navbar />
        </Suspense>
        <div className="mt-20 flex-grow px-4 md:px-16 lg:px-32">
          <Suspense>{children}</Suspense>
        </div>
        <Suspense>
          <Footer />
        </Suspense>
      </div>
      <BackToTop />
      {draftMode().isEnabled && <LiveVisualEditing />}
    </>
  );
}
