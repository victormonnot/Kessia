import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };

// --- v1 compatibility (default export) ---
// Field wrapper preserving the v1 API ({ label, error, ... }) on top of the
// shadcn Input, with the label/input association the tests rely on. Kept here
// rather than in a separate Input.jsx to avoid a case-only filename collision
// that breaks esbuild/Vite resolution.
const InputField = React.forwardRef(function InputField(
  { label, error, className = "", id, ...props },
  ref,
) {
  const inputId = id || props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <Input
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

export default InputField;
