import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import ListingCard from "@/components/listings/ListingCard";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import RequestCard from "@/components/requests/RequestCard";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import { useFavorites } from "@/hooks/useFavorites";

export default function Favorites() {
  const { data, isLoading, isError, refetch } = useFavorites();
  const listings = data?.listings ?? [];
  const requests = data?.requests ?? [];
  const isEmpty = !isLoading && listings.length === 0 && requests.length === 0;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-semibold sm:text-4xl">Mes favoris</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Vos annonces et demandes sauvegardées.
      </p>

      {isError ? (
        <ErrorState className="mt-6" title="Échec du chargement des favoris" onRetry={refetch} />
      ) : isLoading ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ListingCardSkeleton key={i} />
          ))}
        </div>
      ) : isEmpty ? (
        <EmptyState
          className="mt-6"
          icon={Heart}
          title="Aucun favori pour le moment"
          description="Cliquez sur le cœur d'une annonce ou d'une demande pour la retrouver ici."
          action={
            <Button asChild>
              <Link to="/listings">Parcourir les annonces</Link>
            </Button>
          }
        />
      ) : (
        <div className="mt-8 space-y-10">
          {listings.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Annonces ({listings.length})</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </section>
          )}
          {requests.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">Demandes ({requests.length})</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {requests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
