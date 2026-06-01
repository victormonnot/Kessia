import { forwardRef } from "react";
import { ChevronDown } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Compatibility wrapper: a styled *native* <select> keeping the v1 API
// ({ label, error, options, placeholder, ... }). Native keeps it trivially
// compatible with react-hook-form `register` and uncontrolled forms; the Radix
// select primitive (components/ui/select) stays available for richer cases.
const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className = "", id, ...props },
  ref,
) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className="relative">
        <select
          id={inputId}
          ref={ref}
          className={cn(
            "h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-9 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          aria-invalid={error ? true : undefined}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
});

export default Select;
