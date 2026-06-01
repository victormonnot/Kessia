import { Link } from "react-router-dom";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Stars from "@/components/ui/Stars";
import {
  DELIVERABLE_OPTIONS,
  SPECIALTY_OPTIONS,
  labelFor,
} from "@/lib/choices";

export default function ListingCard({ listing }) {
  return (
    <Link to={`/listings/${listing.id}`} className="block">
      <Card className="h-full transition hover:border-primary-500">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-neutral-900">{listing.title}</h3>
          <span className="whitespace-nowrap text-sm font-medium text-primary-700">
            {Number(listing.price).toFixed(0)} €
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-600">{listing.writer_name}</p>
        {listing.writer_reviews_count > 0 && (
          <div className="mt-1">
            <Stars rating={listing.writer_rating} count={listing.writer_reviews_count} />
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="primary">
            {labelFor(listing.specialty, SPECIALTY_OPTIONS)}
          </Badge>
          <Badge>{labelFor(listing.deliverable_type, DELIVERABLE_OPTIONS)}</Badge>
          <Badge>Délai {listing.turnaround_days} j</Badge>
        </div>
      </Card>
    </Link>
  );
}
