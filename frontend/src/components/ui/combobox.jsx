import { useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Strip accents + lowercase so "pediatrie" matches "Pédiatrie".
function normalize(s) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// A searchable single-select (Popover + filterable list). Drop-in for long
// option lists where a plain <select> would be unwieldy.
export function Combobox({
  value,
  onChange,
  options,
  placeholder = "Sélectionner…",
  searchPlaceholder = "Rechercher…",
  emptyText = "Aucun résultat.",
  id,
  className,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = options.find((o) => o.value === value);
  const filtered = query ? options.filter((o) => normalize(o.label).includes(normalize(query))) : options;

  const close = (next) => {
    setOpen(next);
    if (!next) setQuery("");
  };

  const pick = (val) => {
    onChange(val);
    close(false);
  };

  return (
    <Popover open={open} onOpenChange={close}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          id={id}
          className={cn(
            "w-full justify-between font-normal",
            !selected && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[--radix-popover-trigger-width] p-0">
        <div className="flex items-center border-b px-3">
          <Search className="size-4 shrink-0 opacity-50" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            autoFocus
            className="h-10 w-full bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <li className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyText}</li>
          ) : (
            filtered.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => pick(o.value)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                    o.value === value && "bg-accent/50",
                  )}
                >
                  <span>{o.label}</span>
                  {o.value === value && <Check className="size-4 shrink-0" />}
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
