import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonCard() {
  return (
    <div className="flex gap-3 m-auto w-full flex-wrap items-center justify-evenly">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex flex-col space-y-3">
          <Skeleton className="h-[125px] w-[125px] md:w-[200px] lg:w-[250px] rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[125px] md:w-[200px] lg:w-[250px]" />
            <Skeleton className="h-4 w-[100px] md:w-[175px] lg:w-[225px]" />
          </div>
        </div>
      ))}
    </div>
  );
}
