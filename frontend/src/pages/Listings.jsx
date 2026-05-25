import { useSearchParams } from "react-router-dom";

import Card from "@/components/ui/Card";
import ListingCard from "@/components/listings/ListingCard";
import ListingFilters from "@/components/listings/ListingFilters";
import { useListings } from "@/hooks/useListings";

function paramsToObject(searchParams) {
  return Object.fromEntries(
    [...searchParams.entries()].filter(([, v]) => v !== ""),
  );
}

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = paramsToObject(searchParams);
  const { data, isLoading, isError } = useListings(filters);

  const updateFilters = (next) => {
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== ""),
    );
    setSearchParams(cleaned);
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[260px_1fr]">
      <aside>
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase text-neutral-500">
            Filtres
          </h2>
          <ListingFilters value={filters} onChange={updateFilters} />
        </Card>
      </aside>
      <section>
        <h1 className="mb-4 text-2xl font-semibold text-neutral-900">Annonces</h1>
        {isLoading && <p className="text-neutral-500">Chargement…</p>}
        {isError && <p className="text-red-600">Échec du chargement des annonces.</p>}
        {data && data.count === 0 && (
          <p className="text-neutral-500">Aucune annonce ne correspond à vos filtres.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.results?.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
