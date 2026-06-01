// Read-only star rating display. `count` (optional) shows the number of reviews.
export default function Stars({ rating = 0, count }) {
  const rounded = Math.round(rating || 0);
  return (
    <span className="inline-flex items-center gap-0.5 text-sm">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= rounded ? "text-amber-500" : "text-neutral-300"}>
          ★
        </span>
      ))}
      {typeof count === "number" && (
        <span className="ml-1 text-neutral-500">({count})</span>
      )}
    </span>
  );
}
