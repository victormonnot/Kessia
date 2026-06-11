import { Link } from "react-router-dom";
import { BadgeCheck, Clock } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Stars from "@/components/ui/Stars";
import { avatarFor, engravingFor } from "@/lib/demo-assets";
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
      className="group flex h-full flex-col overflow-hidden rounded-lg border bg-card transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      {/* Couverture gravée — fond papier requis pour le blend multiply. */}
      <div className="flex aspect-[5/3] items-center justify-center overflow-hidden border-b bg-background p-3">
        <img
          src={engravingFor(listing.specialty)}
          alt=""
          loading="lazy"
          className="img-engraving max-h-full w-auto transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
          {listing.title}
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Avatar className="size-8">
            <AvatarImage src={avatarFor(listing.writer_name)} alt="" />
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

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-2">
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
          <span className="shrink-0 font-display text-lg font-semibold">
            {formatPrice(listing.price)}
          </span>
        </div>
      </div>
    </Link>
  );
}
