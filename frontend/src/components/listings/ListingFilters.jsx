import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS } from "@/lib/choices";

const RATING_OPTIONS = [
  { value: "3", label: "3★ et plus" },
  { value: "4", label: "4★ et plus" },
  { value: "4.5", label: "4,5★ et plus" },
];

export default function ListingFilters({ value, onChange }) {
  const update = (key, val) => onChange({ ...value, [key]: val || undefined });
  // Reset clears every filter/search but keeps the chosen ordering.
  const reset = () => onChange({ ordering: value.ordering });

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Spécialité"
        placeholder="Toutes les spécialités"
        options={SPECIALTY_OPTIONS}
        value={value.specialty || ""}
        onChange={(e) => update("specialty", e.target.value)}
      />
      <Select
        label="Type de livrable"
        placeholder="Tous les livrables"
        options={DELIVERABLE_OPTIONS}
        value={value.deliverable_type || ""}
        onChange={(e) => update("deliverable_type", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Prix min"
          type="number"
          min="0"
          value={value.price_min || ""}
          onChange={(e) => update("price_min", e.target.value)}
        />
        <Input
          label="Prix max"
          type="number"
          min="0"
          value={value.price_max || ""}
          onChange={(e) => update("price_max", e.target.value)}
        />
      </div>
      <Input
        label="Délai max (jours)"
        type="number"
        min="1"
        value={value.turnaround_max || ""}
        onChange={(e) => update("turnaround_max", e.target.value)}
      />
      <Select
        label="Note minimale"
        placeholder="Toutes les notes"
        options={RATING_OPTIONS}
        value={value.rating_min || ""}
        onChange={(e) => update("rating_min", e.target.value)}
      />
      <Button type="button" variant="ghost" size="sm" className="self-start" onClick={reset}>
        Réinitialiser
      </Button>
    </div>
  );
}
