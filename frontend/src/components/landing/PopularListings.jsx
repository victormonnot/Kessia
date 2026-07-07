import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import ListingCard from "@/components/listings/ListingCard";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import Reveal from "@/components/motion/Reveal";
import { useListings } from "@/hooks/useListings";

// Vraies annonces dès l'accueil : preuve sociale par le produit lui-même.
// Masquée si l'API ne répond pas ou ne renvoie rien (jamais d'état vide visible).
export default function PopularListings() {
  const { data, isLoading, isError } = useListings({ ordering: "-writer_rating" });
  // Une seule annonce par rédacteur (évite deux cartes avec la même photo).
  const seenWriters = new Set();
  const listings = (data?.results ?? [])
    .filter((listing) => {
      if (seenWriters.has(listing.writer)) return false;
      seenWriters.add(listing.writer);
      return true;
    })
    .slice(0, 5);

  if (isError || (!isLoading && listings.length === 0)) return null;

  return (
    <section className="container py-10 sm:py-14">
      <Reveal>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl">Annonces populaires</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Des rédacteurs notés par de vrais clients — les avis sont réservés
              aux commandes terminées.
            </p>
          </div>
          <Link
            to="/listings"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Voir tout <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <ListingCardSkeleton key={i} />)
            : listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      </Reveal>
    </section>
  );
}
