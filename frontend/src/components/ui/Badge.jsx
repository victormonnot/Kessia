import { cn } from "@/lib/utils";

// Compatibility wrapper keeping the v1 semantic variants on theme tokens.
const variants = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  // Bleu : statuts « en cours / ouverte », rôles — l'orange reste aux CTA.
  info: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-destructive/10 text-destructive",
};

export default function Badge({ children, variant = "neutral", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
