import { loadAllProject } from "../../../../sanity/loader/loadQuery";
import { MetadataRoute } from "next";

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Google's limit is 50,000 URLs per sitemap
  const page = 1; // specify the desired page number
  const limit = 1500; // specify the number of items per page
  const initial2 = await loadAllProject(page, limit);
  const data: any = initial2?.data;
  const BASE_URL = process.env.SITE_URL;
  //   console.log(data[0].overview);

  return data.map((blog: { _updatedAt: any; slug: any; date: any }) => ({
    url: `${BASE_URL}/blog/post/${blog?.slug}`,
    lastModified: blog._updatedAt,
    changeFrequency: "weekly",
    priority: 0.5,
  }));
}
