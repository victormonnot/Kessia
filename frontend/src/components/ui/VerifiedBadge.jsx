import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

// Manual vetting is a flagship Kessia feature, so the badge is a real,
// readable mark (emerald = universal "verified", distinct from the orange CTA
// colour and the blue status colour). `title` carries the explanation; on pages
// that aren't wrapped in a Link we can layer a richer tooltip on top.
export const VERIFIED_NOTE =
  "Rédacteur vérifié : qualifications contrôlées manuellement par l'équipe Kessia.";

export default function VerifiedBadge({ solid = false, label = "Vérifié", className }) {
  return (
    <span
      title={VERIFIED_NOTE}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full font-semibold",
        solid
          ? "bg-emerald-600 px-2 py-1 text-xs text-white shadow-sm"
          : "bg-emerald-50 px-2 py-0.5 text-xs text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
        className,
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
