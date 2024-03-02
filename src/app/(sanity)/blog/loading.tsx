import { Skeleton } from "@/components/ui/skeleton";
// import BlogLoader from "@/components/blogs/loader/BlogLoader";

export default function SkeletonCard() {
  return (
    <div className="m-auto flex w-full flex-col items-center justify-center overflow-hidden">
      {/* <BlogLoader /> */}
      <div className="m-auto flex w-full flex-wrap items-center justify-evenly gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[125px] w-[125px] rounded-xl md:w-[200px] lg:w-[250px]" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[125px] md:w-[200px] lg:w-[250px]" />
              <Skeleton className="h-4 w-[100px] md:w-[175px] lg:w-[225px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
