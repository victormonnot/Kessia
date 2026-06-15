import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

import Stars from "@/components/ui/Stars";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { avatarFor } from "@/lib/demo-assets";
import { formatPrice } from "@/lib/format";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

export default function ListingCard({ listing }) {
  // Malt-style preview: the writer's own photo is the cover. Real avatar first,
  // deterministic demo portrait as fallback (always resolves to a face).
  const photo = listing.writer_avatar || avatarFor(listing.writer_name);

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:border-neutral-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={photo}
          alt={listing.writer_name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {listing.writer_is_verified && (
          <VerifiedBadge solid label="Rédacteur vérifié" className="absolute left-2 top-2" />
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {listing.writer_name}
          </span>
          {listing.writer_reviews_count > 0 && (
            <Stars rating={listing.writer_rating} count={listing.writer_reviews_count} />
          )}
        </div>

        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {labelFor(listing.specialty, SPECIALTY_OPTIONS)}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
          {listing.title}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-3 pt-3">
          <span className="inline-flex items-center gap-x-2 text-xs text-muted-foreground">
            {labelFor(listing.deliverable_type, DELIVERABLE_OPTIONS)}
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> {listing.turnaround_days} j
            </span>
          </span>
          <span className="shrink-0 text-base font-semibold">{formatPrice(listing.price)}</span>
        </div>
      </div>
    </Link>
  );
}
