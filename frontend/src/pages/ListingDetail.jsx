import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Stars from "@/components/ui/Stars";
import PlaceOrderModal from "@/components/orders/PlaceOrderModal";
import { useListing } from "@/hooks/useListings";
import { useAuthStore } from "@/store/authStore";
import {
  DELIVERABLE_OPTIONS,
  SPECIALTY_OPTIONS,
  labelFor,
} from "@/lib/choices";

export default function ListingDetail() {
  const { id } = useParams();
  const { data: listing, isLoading } = useListing(id);
  const user = useAuthStore((s) => s.user);
  const [orderOpen, setOrderOpen] = useState(false);

  if (isLoading) return <p className="px-4 py-8 text-neutral-500">Chargement…</p>;
  if (!listing) return <p className="px-4 py-8 text-neutral-500">Introuvable.</p>;

  const isOwner = user?.id === listing.writer?.id;
  const canOrder = user && !isOwner;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">{listing.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="primary">
              {labelFor(listing.specialty, SPECIALTY_OPTIONS)}
            </Badge>
            <Badge>{labelFor(listing.deliverable_type, DELIVERABLE_OPTIONS)}</Badge>
            <Badge>Délai {listing.turnaround_days} j</Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-primary-700">
            {Number(listing.price).toFixed(2)} €
          </p>
        </div>
      </div>

      <Card className="mt-6">
        <h2 className="font-semibold text-neutral-900">À propos de ce service</h2>
        <p className="mt-2 whitespace-pre-line text-neutral-700">{listing.description}</p>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold text-neutral-900">À propos du rédacteur</h2>
        <div className="mt-1 flex items-center gap-2">
          <Link
            to={`/redacteurs/${listing.writer?.id}`}
            className="text-sm font-medium text-primary-700 hover:underline"
          >
            {listing.writer?.first_name} {listing.writer?.last_name}
          </Link>
          {listing.writer_is_verified && <Badge variant="success">Vérifié</Badge>}
        </div>
        {listing.writer_reviews_count > 0 && (
          <div className="mt-1">
            <Stars rating={listing.writer_rating} count={listing.writer_reviews_count} />
          </div>
        )}
        {listing.writer?.bio && (
          <p className="mt-2 text-sm text-neutral-600">{listing.writer.bio}</p>
        )}
      </Card>

      <div className="mt-6 flex gap-3">
        {canOrder && <Button onClick={() => setOrderOpen(true)}>Commander</Button>}
        {!user && (
          <Link to="/login">
            <Button>Se connecter pour commander</Button>
          </Link>
        )}
        {isOwner && (
          <Link to={`/listings/${listing.id}/edit`}>
            <Button variant="outline">Modifier</Button>
          </Link>
        )}
      </div>

      <PlaceOrderModal
        listing={listing}
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
      />
    </div>
  );
}
