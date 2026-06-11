import { Skeleton } from "@/components/ui/skeleton";

export default function ListingCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card">
      <Skeleton className="aspect-[5/3] w-full rounded-none" />
      <div className="flex flex-1 flex-col p-5">
        <Skeleton className="h-5 w-3/4" />
        <div className="mt-3 flex items-center gap-2.5">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-6 w-14" />
        </div>
      </div>
    </div>
  );
}
