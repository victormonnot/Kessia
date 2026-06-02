import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

export default function Spinner({ className }) {
  return <Loader2 className={cn("size-4 animate-spin", className)} aria-hidden="true" />;
}

// Centered full-block loading indicator with an optional label.
export function LoadingBlock({ label = "Chargement…", className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Spinner className="size-6" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
