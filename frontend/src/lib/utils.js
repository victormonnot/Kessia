import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Merge conditional class names and de-duplicate conflicting Tailwind utilities.
// Used by every shadcn/ui primitive vendored under components/ui.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
