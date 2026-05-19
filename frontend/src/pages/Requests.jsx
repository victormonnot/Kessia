import { Link, useSearchParams } from "react-router-dom";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import RequestCard from "@/components/requests/RequestCard";
import { SPECIALTY_OPTIONS } from "@/lib/choices";
import { useRequests } from "@/hooks/useRequests";
import { useAuthStore } from "@/store/authStore";

function paramsToObject(searchParams) {
  return Object.fromEntries(
    [...searchParams.entries()].filter(([, v]) => v !== ""),
  );
}

export default function Requests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = { status: "open", ...paramsToObject(searchParams) };
  const { data, isLoading } = useRequests(filters);
  const user = useAuthStore((s) => s.user);

  const update = (key, value) => {
    const next = { ...filters, [key]: value };
    setSearchParams(
      Object.fromEntries(
        Object.entries(next).filter(([, v]) => v !== undefined && v !== ""),
      ),
    );
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 md:grid-cols-[260px_1fr]">
      <aside>
        <Card>
          <h2 className="mb-3 text-sm font-semibold uppercase text-neutral-500">
            Filtres
          </h2>
          <div className="flex flex-col gap-3">
            <Input
              label="Recherche"
              name="search"
              placeholder="Titre"
              value={filters.search || ""}
              onChange={(e) => update("search", e.target.value)}
            />
            <Select
              label="Spécialité"
              name="specialty"
              placeholder="Toutes les spécialités"
              options={SPECIALTY_OPTIONS}
              value={filters.specialty || ""}
              onChange={(e) => update("specialty", e.target.value)}
            />
            <Select
              label="Statut"
              name="status"
              options={[
                { value: "open", label: "Ouverte" },
                { value: "closed", label: "Fermée" },
              ]}
              value={filters.status || "open"}
              onChange={(e) => update("status", e.target.value)}
            />
          </div>
        </Card>
      </aside>
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-neutral-900">Demandes</h1>
          {user && (
            <Link to="/requests/new">
              <Button>+ Publier une demande</Button>
            </Link>
          )}
        </div>
        {isLoading && <p className="text-neutral-500">Chargement…</p>}
        {data && data.count === 0 && (
          <p className="text-neutral-500">Aucune demande ne correspond à vos filtres.</p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {data?.results?.map((r) => (
            <RequestCard key={r.id} request={r} />
          ))}
        </div>
      </section>
    </div>
  );
}
