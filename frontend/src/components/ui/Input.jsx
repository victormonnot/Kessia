import { forwardRef } from "react";

import { Input as ShadInput } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

// Compatibility wrapper preserving the v1 API ({ label, error, ... }) on top of
// the shadcn Input. Keeps the label/input association the tests rely on.
const Input = forwardRef(function Input({ label, error, className = "", id, ...props }, ref) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <ShadInput
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(error && "border-destructive focus-visible:ring-destructive", className)}
        {...props}
      />
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
});

export default Input;
