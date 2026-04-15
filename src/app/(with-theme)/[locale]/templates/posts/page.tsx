import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import type { Metadata } from "next";
import SectionPageTitle from "@/components/sections/section-page-title";
import PostList from "@/components/posts/post-list";
import PostEditor from "@/components/posts/post-editor";
import { getI18n } from "@/locales/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getI18n();

  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!),
    title: t("templates.posts.metaTitle"),
    description: t("templates.posts.metaDescription"),
  };
}

export default async function BlogPostsPage() {
  const t = await getI18n();

  return (
    <>
      <Header />
      <main className="relative">
        <SectionPageTitle>{t("header.blog")}</SectionPageTitle>
        <section className="border-b py-24">
          <div className="container">
            <PostList limit={6} showPagination={true} />
          </div>
        </section>
        <PostEditor />
      </main>
      <Footer />
    </>
  );
}
