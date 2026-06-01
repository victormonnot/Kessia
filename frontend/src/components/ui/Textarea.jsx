import { forwardRef } from "react";

import { Textarea as ShadTextarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Compatibility wrapper preserving the v1 API ({ label, error, rows, ... }).
const Textarea = forwardRef(function Textarea(
  { label, error, className = "", id, rows = 4, ...props },
  ref,
) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <ShadTextarea
        id={inputId}
        ref={ref}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
        {...props}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
});

export default Textarea;
