import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { Button } from "@/components/ui/button";
import { SPECIALTY_OPTIONS } from "@/lib/choices";

const STATUS_OPTIONS = [
  { value: "open", label: "Ouverte" },
  { value: "closed", label: "Fermée" },
];

export default function RequestFilters({ value, onChange }) {
  const update = (key, val) => onChange({ ...value, [key]: val || undefined });
  // Reset keeps ordering and restores the default "open" status.
  const reset = () => onChange({ ordering: value.ordering, status: "open" });

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Spécialité"
        placeholder="Toutes les spécialités"
        options={SPECIALTY_OPTIONS}
        value={value.specialty || ""}
        onChange={(e) => update("specialty", e.target.value)}
      />
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
