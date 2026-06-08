import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { SPECIALTY_OPTIONS } from "@/lib/choices";

const STATUS_OPTIONS = [
  { value: "open", label: "Ouverte" },
  { value: "closed", label: "Fermée" },
];

const SPECIALTY_FILTER_OPTIONS = [
  { value: "", label: "Toutes les spécialités" },
  ...SPECIALTY_OPTIONS,
];

export default function RequestFilters({ value, onChange }) {
  const update = (key, val) => onChange({ ...value, [key]: val || undefined });
  // Reset keeps ordering and restores the default "open" status.
  const reset = () => onChange({ ordering: value.ordering, status: "open" });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Spécialité</label>
        <Combobox
          options={SPECIALTY_FILTER_OPTIONS}
          value={value.specialty || ""}
          onChange={(v) => update("specialty", v)}
          placeholder="Toutes les spécialités"
          searchPlaceholder="Rechercher une spécialité…"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Budget min"
          type="number"
          min="0"
          value={value.budget_min || ""}
          onChange={(e) => update("budget_min", e.target.value)}
        />
        <Input
          label="Budget max"
          type="number"
          min="0"
          value={value.budget_max || ""}
          onChange={(e) => update("budget_max", e.target.value)}
        />
      </div>
      <Input
        label="Échéance avant le"
        type="date"
        value={value.deadline_before || ""}
        onChange={(e) => update("deadline_before", e.target.value)}
      />
      <Select
        label="Statut"
        options={STATUS_OPTIONS}
        value={value.status || "open"}
        onChange={(e) => update("status", e.target.value)}
      />
      <Button type="button" variant="ghost" size="sm" className="self-start" onClick={reset}>
        Réinitialiser
      </Button>
    </div>
  );
}
