import { Link } from "react-router-dom";
import { BadgeCheck, Clock } from "lucide-react";

import Stars from "@/components/ui/Stars";
import { formatPrice } from "@/lib/format";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

export default function ListingCard({ listing }) {
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex h-full flex-col rounded-lg border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {listing.title}
        </h3>
        <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
          {formatPrice(listing.price)}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="inline-flex items-center gap-1 font-medium text-foreground">
          {listing.writer_name}
          {listing.writer_is_verified && (
            <BadgeCheck className="size-4 text-primary" aria-label="Rédacteur vérifié" />
          )}
        </span>
        {listing.writer_reviews_count > 0 && (
          <Stars rating={listing.writer_rating} count={listing.writer_reviews_count} />
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
          {labelFor(listing.specialty, SPECIALTY_OPTIONS)}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {labelFor(listing.deliverable_type, DELIVERABLE_OPTIONS)}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          <Clock className="size-3" /> {listing.turnaround_days} j
        </span>
      </div>
    </Link>
  );
}
