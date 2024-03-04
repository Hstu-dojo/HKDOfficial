import dynamic from "next/dynamic";
import { draftMode } from "next/headers";
import Link from "next/link";

import { HomePage } from "@/components/blogs/pages/home/HomePage";
import {
  loadHomePage,
  loadAllProject,
} from "../../../../sanity/loader/loadQuery";
import { studioUrl } from "../../../../sanity/env";
const HomePagePreview = dynamic(
  () => import("@/components/blogs/pages/home/HomePagePreview"),
);

export default async function IndexRoute() {
  const initial = await loadHomePage();
  const page = 25; // specify the desired page number
  const limit = 1; // specify the number of items per page
  const initial2 = await loadAllProject(page, limit);
  // console.log(initial2?.data);

  if (draftMode().isEnabled) {
    return <HomePagePreview initial={initial} />;
  }

  if (!initial.data) {
    return (
      <div className="text-center">
        You don&rsquo;t have a homepage yet,{" "}
        <Link href={`${studioUrl}/desk/home`} className="underline">
          create one now
        </Link>
        !
      </div>
    );
  }

  return <HomePage data={initial.data} data2={initial2?.data} />;
}
