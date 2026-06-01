import { useParams } from "react-router-dom";

import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Stars from "@/components/ui/Stars";
import ListingCard from "@/components/listings/ListingCard";
import { useWriter } from "@/hooks/useWriters";
import { useWriterReviews } from "@/hooks/useReviews";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

export default function WriterProfile() {
  const { id } = useParams();
  const { data: writer, isLoading, isError } = useWriter(id);
  const { data: reviews } = useWriterReviews(id);

  if (isLoading) return <p className="px-4 py-8 text-neutral-500">Chargement…</p>;
  if (isError || !writer)
    return <p className="px-4 py-8 text-neutral-500">Profil introuvable.</p>;

  const fullName =
    `${writer.first_name || ""} ${writer.last_name || ""}`.trim() || "Rédacteur";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-neutral-900">{fullName}</h1>
          {writer.is_verified && <Badge variant="success">Vérifié</Badge>}
        </div>
        <div className="mt-1">
          {writer.reviews_count > 0 ? (
            <Stars rating={writer.avg_rating} count={writer.reviews_count} />
          ) : (
            <span className="text-sm text-neutral-500">Pas encore d'avis</span>
          )}
        </div>
        {writer.bio && (
          <p className="mt-3 whitespace-pre-line text-neutral-700">{writer.bio}</p>
        )}
        {writer.specialties?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {writer.specialties.map((s) => (
              <Badge key={s} variant="primary">
                {labelFor(s, SPECIALTY_OPTIONS)}
              </Badge>
            ))}
          </div>
        )}
      </Card>

      <h2 className="mt-8 text-lg font-semibold text-neutral-900">Annonces</h2>
      {writer.listings?.length > 0 ? (
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {writer.listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      ) : (
        <p className="mt-3 text-neutral-500">Aucune annonce publiée pour le moment.</p>
      )}

      {reviews?.results?.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-semibold text-neutral-900">Avis</h2>
          <div className="mt-3 space-y-3">
            {reviews.results.map((r) => (
              <Card key={r.id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-900">
                    {r.doctor?.first_name} {r.doctor?.last_name}
                  </span>
                  <Stars rating={r.rating} />
                </div>
                {r.comment && (
                  <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">
                    {r.comment}
                  </p>
                )}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
