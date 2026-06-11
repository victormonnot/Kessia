import { Skeleton } from "@/components/ui/skeleton";

export default function ListingCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="mt-3 h-3 w-20" />
        <Skeleton className="mt-2 h-5 w-3/4" />
        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>
    </div>
  );
}
