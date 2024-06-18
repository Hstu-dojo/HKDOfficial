import SectionLatestNews from "@/components/sections/section-latest-news";
import { loadAllProject } from "../../../sanity/loader/loadQuery";

async function SectionBlog() {
  const page = 1; // specify the desired page number
  const limit = 100;
  const initial2 = await loadAllProject(page, limit);
  return <SectionLatestNews data2={initial2?.data} />;
}

export default SectionBlog;
