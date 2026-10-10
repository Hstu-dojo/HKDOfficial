import { Skeleton } from "@/components/ui/skeleton";
export default function BlogLoading() {
  return (
    <div className="journal-loading" role="status" aria-label="Loading journal">
      <span className="sr-only">Loading journal…</span>
      <Skeleton className="mb-5 h-4 w-32" />
      <Skeleton className="mb-6 h-16 w-full max-w-xl" />
      <Skeleton className="mb-10 h-5 w-full max-w-md" />
      <div className="journal-story-grid">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index}>
            <Skeleton className="aspect-[4/3] w-full rounded-xl" />
            <Skeleton className="mt-5 h-6 w-4/5" />
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
