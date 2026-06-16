import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FileText, Plus, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ListingCard from "@/components/listings/ListingCard";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import ListingFilters from "@/components/listings/ListingFilters";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import { cn } from "@/lib/utils";
import { useListings } from "@/hooks/useListings";
import { useAuthStore } from "@/store/authStore";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récentes" },
  { value: "price", label: "Prix croissant" },
  { value: "-price", label: "Prix décroissant" },
  { value: "-writer_rating", label: "Mieux notées" },
  { value: "turnaround_days", label: "Délai le plus court" },
];

// Quick chips above the grid — the specialties people reach for most.
const QUICK_SPECIALTIES = [
  "cardiologie",
  "oncologie",
  "neurologie",
  "pediatrie",
  "psychiatrie",
  "radiologie",
];

const FILTER_KEYS = [
  "specialty",
  "deliverable_type",
  "price_min",
  "price_max",
  "turnaround_max",
  "rating_min",
];

function paramsToObject(searchParams) {
  return Object.fromEntries([...searchParams.entries()].filter(([, v]) => v !== ""));
}

export default function Listings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = paramsToObject(searchParams);
  const page = Number(filters.page || 1);
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, isFetching, refetch } = useListings(filters);
  const [searchText, setSearchText] = useState(filters.search || "");

  const updateFilters = (next) => {
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== undefined && v !== ""),
    );
    delete cleaned.page; // changing filters returns to the first page
    setSearchParams(cleaned);
  };

  const goToPage = (p) => setSearchParams({ ...filters, page: String(p) });
  const submitSearch = (e) => {
    e.preventDefault();
    updateFilters({ ...filters, search: searchText });
  };
  const clearSearch = () => {
    setSearchText("");
    updateFilters({ ...filters, search: undefined });
  };

  const toggleSpecialty = (s) =>
    updateFilters({ ...filters, specialty: filters.specialty === s ? undefined : s });

  const removeFilter = (key) => {
    if (key === "search") setSearchText("");
    updateFilters({ ...filters, [key]: undefined });
  };

  const resetAll = () => {
    setSearchText("");
    updateFilters({ ordering: filters.ordering });
  };

  // Human-readable pills for every active filter (each removable).
  const activePills = [];
  if (filters.search) activePills.push({ key: "search", label: `« ${filters.search} »` });
  if (filters.specialty)
    activePills.push({ key: "specialty", label: labelFor(filters.specialty, SPECIALTY_OPTIONS) });
  if (filters.deliverable_type)
    activePills.push({
      key: "deliverable_type",
      label: labelFor(filters.deliverable_type, DELIVERABLE_OPTIONS),
    });
  if (filters.price_min) activePills.push({ key: "price_min", label: `≥ ${filters.price_min} €` });
  if (filters.price_max) activePills.push({ key: "price_max", label: `≤ ${filters.price_max} €` });
  if (filters.turnaround_max)
    activePills.push({ key: "turnaround_max", label: `≤ ${filters.turnaround_max} j` });
  if (filters.rating_min)
    activePills.push({ key: "rating_min", label: `≥ ${filters.rating_min}★` });

  const activeCount = FILTER_KEYS.filter((k) => filters[k]).length;
  const total = data?.count ?? 0;

  return (
    <div className="container py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Annonces</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Recherche en cours…"
              : `${total} annonce${total > 1 ? "s" : ""} de rédaction médicale`}
          </p>
        </div>
        {user?.is_writer && (
          <Button asChild>
            <Link to="/listings/new">
              <Plus className="size-4" /> Publier une annonce
            </Link>
          </Button>
        )}
      </header>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <form onSubmit={submitSearch} className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Rechercher une annonce…"
            aria-label="Rechercher une annonce"
            className="pl-9 pr-9"
          />
          {searchText && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </form>
        <div className="flex gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="lg:hidden">
                <SlidersHorizontal className="size-4" /> Filtres
                {activeCount > 0 && ` (${activeCount})`}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Filtres</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <ListingFilters value={filters} onChange={updateFilters} />
              </div>
            </SheetContent>
          </Sheet>
          <Select
            aria-label="Trier par"
            options={ORDERING_OPTIONS}
            value={filters.ordering || "-created_at"}
            onChange={(e) => updateFilters({ ...filters, ordering: e.target.value })}
            className="min-w-[11rem]"
          />
        </div>
      </div>

      {/* Quick specialty chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_SPECIALTIES.map((s) => {
          const active = filters.specialty === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggleSpecialty(s)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                active
                  ? "border-foreground bg-foreground text-background"
                  : "text-foreground hover:border-foreground",
              )}
            >
              {labelFor(s, SPECIALTY_OPTIONS)}
            </button>
          );
        })}
      </div>

      {/* Active filter pills */}
      {activePills.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activePills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              onClick={() => removeFilter(pill.key)}
              className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground hover:bg-accent"
              aria-label={`Retirer le filtre ${pill.label}`}
            >
              {pill.label}
              <X className="size-3" />
            </button>
          ))}
          <button
            type="button"
            onClick={resetAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            Tout effacer
          </button>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Filtres
            </h2>
            <ListingFilters value={filters} onChange={updateFilters} />
          </div>
        </aside>

        <section>
          {/* A settled error only: while a refetch is recovering from a cached
              error, show the skeleton instead of flashing the error state. */}
          {isError && !isFetching ? (
            <ErrorState title="Échec du chargement des annonces" onRetry={refetch} />
          ) : isLoading || isError ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : total === 0 ? (
            <EmptyState
              icon={FileText}
              title="Aucune annonce trouvée"
              description="Essayez d'élargir vos critères ou de réinitialiser les filtres."
            />
          ) : (
            <>
              <div
                className={cn(
                  "grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
                  isFetching && "opacity-60 transition-opacity",
                )}
              >
                {data.results.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
              <Pagination
                page={page}
                hasPrev={Boolean(data.previous)}
                hasNext={Boolean(data.next)}
                onPage={goToPage}
              />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
