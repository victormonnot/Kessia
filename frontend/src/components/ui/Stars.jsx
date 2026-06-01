import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

// Read-only star rating. `count` (optional) shows the number of reviews.
export default function Stars({ rating = 0, count, size = "sm", className = "" }) {
  const rounded = Math.round(rating || 0);
  const dim = size === "lg" ? "size-5" : "size-4";
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 text-sm", className)}
      aria-label={`Note : ${Number(rating || 0).toFixed(1)} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(
            dim,
            i <= rounded ? "fill-amber-400 text-amber-400" : "fill-transparent text-neutral-300",
          )}
        />
      ))}
      {typeof count === "number" && <span className="ml-1 text-muted-foreground">({count})</span>}
    </span>
  );
}
