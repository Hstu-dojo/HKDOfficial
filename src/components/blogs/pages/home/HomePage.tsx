import type { EncodeDataAttributeCallback } from "@sanity/react-loader";
import Link from "next/link";

import { ProjectListItem } from "./ProjectListItem";
import { Header } from "../../shared/Header";
import { resolveHref } from "../../../../../sanity/lib/utils";
import type { HomePagePayload } from "../../../../../sanity/lib/sanity_types";
import { FollowerPointerCard } from "@/components/ui/following-pointer";
import Image from "next/image";
import AvatarBox from "../../shared/AvatarBox";

export interface HomePageProps {
  data: HomePagePayload | null;
  encodeDataAttribute?: EncodeDataAttributeCallback;
}

export function HomePage({ data, encodeDataAttribute }: HomePageProps) {
  // Default to an empty object to allow previews on non-existent documents
  const { overview = [], showcaseProjects = [], title = "" } = data ?? {};
  // console.log(showcaseProjects[0]);
  return (
    <div className="space-y-20">
      {/* Header */}
      {title && <Header centered title={title} description={overview} />}
      {/* Showcase projects */}
      {showcaseProjects && showcaseProjects.length > 0 && (
        <div className="mx-auto max-w-[100rem] rounded-md border">
          {showcaseProjects.map((project, key) => {
            const href = resolveHref(project?._type, project?.slug);
            if (!href) {
              return null;
            }
            return (
              <Link
                key={key}
                href={href}
                data-sanity={encodeDataAttribute?.([
                  "showcaseProjects",
                  key,
                  "slug",
                ])}
              >
                <FollowerPointerCard
                  title={
                    <TitleComponent
                      // @ts-ignore
                      title={project?.author?.name as any}
                      // @ts-ignore
                      avatar={project?.author?.image as any}
                    />
                  }
                >
                  <ProjectListItem project={project} odd={key % 2} />
                </FollowerPointerCard>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const TitleComponent = ({ title, avatar }: { title: any; avatar: any }) => (
  <div className="flex items-center space-x-2">
    <AvatarBox
      image={avatar}
      alt={`Cover image from `}
      classesWrapper="relative"
    />
    <p>{title}</p>
  </div>
);

export default HomePage;
