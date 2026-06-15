import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ClipboardList, Plus, Search, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Select from "@/components/ui/Select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import RequestCard from "@/components/requests/RequestCard";
import RequestCardSkeleton from "@/components/requests/RequestCardSkeleton";
import RequestFilters from "@/components/requests/RequestFilters";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/feedback/EmptyState";
import ErrorState from "@/components/feedback/ErrorState";
import { cn } from "@/lib/utils";
import { useRequests } from "@/hooks/useRequests";
import { useAuthStore } from "@/store/authStore";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";
import { formatDate } from "@/lib/format";

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récentes" },
  { value: "deadline", label: "Échéance proche" },
  { value: "-budget", label: "Budget décroissant" },
  { value: "budget", label: "Budget croissant" },
];

const QUICK_SPECIALTIES = [
  "cardiologie",
  "oncologie",
  "neurologie",
  "pediatrie",
  "psychiatrie",
  "radiologie",
];

function paramsToObject(searchParams) {
  return Object.fromEntries([...searchParams.entries()].filter(([, v]) => v !== ""));
}

export default function Requests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = { status: "open", ...paramsToObject(searchParams) };
  const page = Number(filters.page || 1);
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, isFetching, refetch } = useRequests(filters);
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
    // Status has no "off" state — removing it restores the default "open".
    updateFilters({ ...filters, [key]: key === "status" ? "open" : undefined });
  };

  const resetAll = () => {
    setSearchText("");
    updateFilters({ ordering: filters.ordering, status: "open" });
  };

  const activePills = [];
  if (filters.search) activePills.push({ key: "search", label: `« ${filters.search} »` });
  if (filters.specialty)
    activePills.push({ key: "specialty", label: labelFor(filters.specialty, SPECIALTY_OPTIONS) });
  if (filters.budget_min) activePills.push({ key: "budget_min", label: `≥ ${filters.budget_min} €` });
  if (filters.budget_max) activePills.push({ key: "budget_max", label: `≤ ${filters.budget_max} €` });
  if (filters.deadline_before)
    activePills.push({
      key: "deadline_before",
      label: `Avant le ${formatDate(filters.deadline_before)}`,
    });
  if (filters.status && filters.status !== "open")
    activePills.push({ key: "status", label: "Fermées" });

  const activeCount =
    ["specialty", "budget_min", "budget_max", "deadline_before"].filter((k) => filters[k]).length +
    (filters.status && filters.status !== "open" ? 1 : 0);
  const total = data?.count ?? 0;

  return (
    <div className="container py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Demandes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Recherche en cours…"
              : `${total} demande${total > 1 ? "s" : ""} de médecins`}
          </p>
        </div>
        {user && (
          <Button asChild>
            <Link to="/requests/new">
              <Plus className="size-4" /> Publier une demande
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
            placeholder="Rechercher une demande…"
            aria-label="Rechercher une demande"
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
                <RequestFilters value={filters} onChange={updateFilters} />
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
            <RequestFilters value={filters} onChange={updateFilters} />
          </div>
        </aside>

        <section>
          {isError && !isFetching ? (
            <ErrorState title="Échec du chargement des demandes" onRetry={refetch} />
          ) : isLoading || isError ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <RequestCardSkeleton key={i} />
              ))}
            </div>
          ) : total === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Aucune demande trouvée"
              description="Aucune demande ne correspond à vos critères pour le moment."
              action={
                user && (
                  <Button asChild>
                    <Link to="/requests/new">Publier une demande</Link>
                  </Button>
                )
              }
            />
          ) : (
            <>
              <div
                className={cn(
                  "grid gap-4 sm:grid-cols-2",
                  isFetching && "opacity-60 transition-opacity",
                )}
              >
                {data.results.map((request) => (
                  <RequestCard key={request.id} request={request} />
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
