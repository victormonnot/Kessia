import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS } from "@/lib/choices";

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
    </div>
  );
}
