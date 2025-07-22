import { ProjectPayload } from "../../../sanity/lib/sanity_types";
import { loadFeaturedProjects } from "../../../sanity/loader/loadQuery";
import FeaturedPostsClient from "./featured-posts-client";

export const revalidate = 60; // Revalidate every 60 seconds

const FeaturedPostsServer = async () => {
  let featuredPosts: ProjectPayload[] = [];
  
  try {
    const result = await loadFeaturedProjects();
    featuredPosts = result.data || [];
  } catch (error) {
    console.error("Failed to fetch featured posts:", error);
    return (
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
              ✨ Featured Content
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
              Featured Posts
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Featured posts are currently being loaded...
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
