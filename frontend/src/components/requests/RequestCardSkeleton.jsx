import { Skeleton } from "@/components/ui/skeleton";

export default function RequestCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-40" />
      <div className="mt-auto flex gap-2 pt-6">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}
