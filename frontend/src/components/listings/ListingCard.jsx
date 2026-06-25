import { Link } from "react-router-dom";
import { Clock } from "lucide-react";

import Stars from "@/components/ui/Stars";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { formatPrice, initialsFromName } from "@/lib/format";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

export default function ListingCard({ listing }) {
  // Malt-style preview: the writer's own photo is the cover. With no photo we
  // show their initials (never a stand-in face).
  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
        {listing.writer_avatar ? (
          <img
            src={listing.writer_avatar}
            alt={listing.writer_name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-5xl font-semibold text-muted-foreground">
            {initialsFromName(listing.writer_name)}
          </div>
        )}
        {listing.writer_is_verified && (
          <VerifiedBadge solid label="Rédacteur vérifié" className="absolute left-2 top-2" />
        )}
        <FavoriteButton
          type="listing"
          id={listing.id}
          favorited={listing.is_favorited}
          className="absolute right-2 top-2 size-8"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {listing.writer_name}
          </span>
          {listing.writer_reviews_count > 0 ? (
            <Stars rating={listing.writer_rating} count={listing.writer_reviews_count} />
          ) : (
            <span className="shrink-0 text-xs text-muted-foreground">Nouveau</span>
          )}
        </div>

        <p className="mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {labelFor(listing.specialty, SPECIALTY_OPTIONS)}
        </p>
        <h3 className="mt-1 line-clamp-2 font-semibold leading-snug transition-colors group-hover:text-primary">
          {listing.title}
        </h3>

        <div className="mt-3 flex items-center gap-x-3 text-xs text-muted-foreground">
          <span className="truncate">{labelFor(listing.deliverable_type, DELIVERABLE_OPTIONS)}</span>
          <span className="inline-flex shrink-0 items-center gap-1">
            <Clock className="size-3" /> {listing.turnaround_days} j
          </span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
          <span className="text-xs text-muted-foreground">À partir de</span>
          <span className="shrink-0 text-lg font-bold">{formatPrice(listing.price)}</span>
        </div>
      </div>
    </Link>
  );
}
