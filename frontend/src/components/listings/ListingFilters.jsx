import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS } from "@/lib/choices";

const RATING_OPTIONS = [
  { value: "3", label: "3★ et plus" },
  { value: "4", label: "4★ et plus" },
  { value: "4.5", label: "4,5★ et plus" },
];

const ORDERING_OPTIONS = [
  { value: "-created_at", label: "Plus récentes" },
  { value: "price", label: "Prix croissant" },
  { value: "-price", label: "Prix décroissant" },
  { value: "-writer_rating", label: "Mieux notées" },
  { value: "turnaround_days", label: "Délai le plus court" },
];

export default function ListingFilters({ value, onChange }) {
  const update = (key, val) => onChange({ ...value, [key]: val || undefined });

  return (
    <div className="flex flex-col gap-3">
      <Input
        label="Recherche"
        name="search"
        placeholder="Titre ou description"
        value={value.search || ""}
        onChange={(e) => update("search", e.target.value)}
      />
      <Select
        label="Spécialité"
        name="specialty"
        placeholder="Toutes les spécialités"
        options={SPECIALTY_OPTIONS}
        value={value.specialty || ""}
        onChange={(e) => update("specialty", e.target.value)}
      />
      <Select
        label="Livrable"
        name="deliverable_type"
        placeholder="Tous les livrables"
        options={DELIVERABLE_OPTIONS}
        value={value.deliverable_type || ""}
        onChange={(e) => update("deliverable_type", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          label="Prix min"
          name="price_min"
          type="number"
          min="0"
          value={value.price_min || ""}
          onChange={(e) => update("price_min", e.target.value)}
        />
        <Input
          label="Prix max"
          name="price_max"
          type="number"
          min="0"
          value={value.price_max || ""}
          onChange={(e) => update("price_max", e.target.value)}
        />
      </div>
      <Input
        label="Délai max (jours)"
        name="turnaround_max"
        type="number"
        min="1"
        value={value.turnaround_max || ""}
        onChange={(e) => update("turnaround_max", e.target.value)}
      />
      <Select
        label="Note minimale"
        name="rating_min"
        placeholder="Toutes les notes"
        options={RATING_OPTIONS}
        value={value.rating_min || ""}
        onChange={(e) => update("rating_min", e.target.value)}
      />
      <Select
        label="Trier par"
        name="ordering"
        options={ORDERING_OPTIONS}
        value={value.ordering || "-created_at"}
        onChange={(e) => update("ordering", e.target.value)}
      />
    </div>
  );
}
