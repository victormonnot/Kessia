import { Clock, FileText, Star, Stethoscope, Wallet } from "lucide-react";

import Input from "@/components/ui/input";
import Select from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { DELIVERABLE_OPTIONS, SPECIALTY_OPTIONS } from "@/lib/choices";

const RATING_CHOICES = [
  { value: "", label: "Toutes" },
  { value: "3", label: "3★+" },
  { value: "4", label: "4★+" },
  { value: "4.5", label: "4,5★+" },
];

const SPECIALTY_FILTER_OPTIONS = [
  { value: "", label: "Toutes les spécialités" },
  ...SPECIALTY_OPTIONS,
];

// One labelled, icon-headed block per filter — keeps the sidebar scannable
// instead of a flat stack of identical inputs.
function Section({ icon: Icon, title, children }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" /> {title}
      </p>
      {children}
    </div>
  );
}

export default function ListingFilters({ value, onChange }) {
  const update = (key, val) => onChange({ ...value, [key]: val || undefined });
  // Reset clears every filter/search but keeps the chosen ordering.
  const reset = () => onChange({ ordering: value.ordering });

  return (
    <div className="divide-y">
      <Section icon={Stethoscope} title="Spécialité">
        <Combobox
          options={SPECIALTY_FILTER_OPTIONS}
          value={value.specialty || ""}
          onChange={(v) => update("specialty", v)}
          placeholder="Toutes les spécialités"
          searchPlaceholder="Rechercher une spécialité…"
        />
      </Section>

      <Section icon={FileText} title="Type de livrable">
        <Select
          placeholder="Tous les livrables"
          options={DELIVERABLE_OPTIONS}
          value={value.deliverable_type || ""}
          onChange={(e) => update("deliverable_type", e.target.value)}
        />
      </Section>

      <Section icon={Wallet} title="Budget (€)">
        <div className="grid grid-cols-2 gap-3">
          <Input
            type="number"
            min="0"
            placeholder="Min"
            aria-label="Budget minimum"
            value={value.price_min || ""}
            onChange={(e) => update("price_min", e.target.value)}
          />
          <Input
            type="number"
            min="0"
            placeholder="Max"
            aria-label="Budget maximum"
            value={value.price_max || ""}
            onChange={(e) => update("price_max", e.target.value)}
          />
        </div>
      </Section>

      <Section icon={Clock} title="Délai max (jours)">
        <Input
          type="number"
          min="1"
          placeholder="Ex. 14"
          aria-label="Délai maximum en jours"
          value={value.turnaround_max || ""}
          onChange={(e) => update("turnaround_max", e.target.value)}
        />
      </Section>

      <Section icon={Star} title="Note minimale">
        <div className="flex flex-wrap gap-2">
          {RATING_CHOICES.map((c) => {
            const active = (value.rating_min || "") === c.value;
            return (
              <button
                key={c.value || "all"}
                type="button"
                onClick={() => update("rating_min", c.value)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-3 py-1 text-sm font-medium transition-colors",
                  active
                    ? "border-foreground bg-foreground text-background"
                    : "text-foreground hover:border-foreground",
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </Section>

      <div className="pt-4">
        <Button type="button" variant="ghost" size="sm" className="px-0" onClick={reset}>
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  );
}
