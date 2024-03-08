import type { EncodeDataAttributeCallback } from "@sanity/react-loader";
import Link from "next/link";
import { HallOfFrame } from "@/components/sections/section-hall-of-frame";
import { ProjectListItem } from "./ProjectListItem";
import { Header } from "../../shared/Header";
import { resolveHref } from "../../../../../sanity/lib/utils";
import type { HomePagePayload } from "../../../../../sanity/lib/sanity_types";
import { FollowerPointerCard } from "@/components/ui/following-pointer";
import AvatarBox from "../../shared/AvatarBox";
import { WallMagazine } from "../../shared/WallMagazine";
import TypewriterEffectComponent from "../../shared/TypewriterEffectComponent";
import AllProjects from "../../allProjects";


export interface HomePageProps {
  data: HomePagePayload | null;
  data2: any;
  avatar: any;
  trending: any;
  encodeDataAttribute?: EncodeDataAttributeCallback;
}

export function HomePage({
  data,
  data2,
  avatar,
  trending,
  encodeDataAttribute,
}: HomePageProps) {
  // Default to an empty object to allow previews on non-existent documents
  const { overview = [], showcaseProjects = [], title = "" } = data ?? {};
  // console.log(data2);
  return (
    <div>
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
      <div className="mt-20 lg:mt-28">
        <div className="my-5 text-center">
          <TypewriterEffectComponent text={"Explore our Wall Magazine"} />
        </div>
        <WallMagazine trending={trending} avatar={avatar} />
        <AllProjects data2={data2} />
        <HallOfFrame />
      </div>
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
