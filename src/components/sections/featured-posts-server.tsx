import { ProjectPayload } from "../../../sanity/lib/sanity_types";
import { loadFeaturedProjects } from "../../../sanity/loader/loadQuery";
import FeaturedPostsClient from "./featured-posts-client";
import { getScopedI18n } from "@/locales/server";

export const revalidate = 60; // Revalidate every 60 seconds

const FeaturedPostsServer = async () => {
  const t = await getScopedI18n("homepage.featuredPosts");
  let featuredPosts: ProjectPayload[] = [];

  try {
    const result = await loadFeaturedProjects();
    featuredPosts = result.data || [];
  } catch (error) {
    console.error("Failed to fetch featured posts:", error);
    return (
      <section className="py-16 bg-muted    ">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <span className="inline-block px-4 py-2 bg-muted text-primary dark:bg-muted dark:text-primary rounded-full text-sm font-medium mb-4">
              {t("title")}
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground dark:text-white mb-4">
              {t("subtitle")}
            </h2>
            <p className="text-muted-foreground dark:text-gray-300">
              {t("description")}
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (featuredPosts.length === 0) {
    return null; // Don't render section if no featured posts
  }

  return <FeaturedPostsClient featuredPosts={featuredPosts} />;
};

export default FeaturedPostsServer;
