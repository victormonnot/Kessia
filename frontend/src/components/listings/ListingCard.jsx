import { Link } from "react-router-dom";
import { BadgeCheck, Clock } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Stars from "@/components/ui/Stars";
import { avatarFor, coverFor } from "@/lib/demo-assets";
import { formatPrice } from "@/lib/format";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

export default function ListingCard({ listing }) {
  const writerInitials = (listing.writer_name || "")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:border-neutral-300 hover:shadow-md"
    >
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img
          src={coverFor(listing.specialty)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Avatar className="size-7">
            <AvatarImage src={listing.writer_avatar || avatarFor(listing.writer_name)} alt="" />
            <AvatarFallback className="bg-secondary text-xs font-semibold text-secondary-foreground">
              {writerInitials}
            </AvatarFallback>
          </Avatar>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
            {listing.writer_name}
            {listing.writer_is_verified && (
              <BadgeCheck className="size-4 text-primary" aria-label="Rédacteur vérifié" />
            )}
          </span>
          {listing.writer_reviews_count > 0 && (
            <Stars rating={listing.writer_rating} count={listing.writer_reviews_count} />
          )}
        </div>

        <p className="mt-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
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
