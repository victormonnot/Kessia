import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Stars from "@/components/ui/Stars";
import { formatDate, fullName, initials } from "@/lib/format";

export default function ReviewCard({ review }) {
  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-muted text-xs font-semibold">
              {initials(review.doctor)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{fullName(review.doctor)}</p>
            {review.created_at && (
              <p className="text-xs text-muted-foreground">{formatDate(review.created_at)}</p>
            )}
          </div>
        </div>
        <Stars rating={review.rating} />
      </div>
      {review.comment && (
        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{review.comment}</p>
      )}
    </div>
  );
}
