import Stars from "@/components/ui/Stars";

const ORDER = ["5", "4", "3", "2", "1"];

// Average score + per-star distribution bars, à la Malt/Fiverr.
export default function RatingBreakdown({ breakdown, avg, total }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <div className="text-center sm:w-40 sm:shrink-0">
        <p className="text-4xl font-bold tracking-tight">{avg != null ? avg.toFixed(1) : "—"}</p>
        <div className="mt-1 flex justify-center">
          <Stars rating={avg || 0} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {total} avis{total > 1 ? "" : ""}
        </p>
      </div>
      <div className="flex-1 space-y-1.5">
        {ORDER.map((star) => {
          const n = breakdown?.[star] || 0;
          const pct = total ? Math.round((n / total) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-5 text-muted-foreground">{star}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-7 text-right text-muted-foreground">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
