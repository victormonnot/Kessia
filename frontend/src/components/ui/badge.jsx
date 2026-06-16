import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

// --- v1 compatibility (default export) ---
// Semantic pill variants on theme tokens (neutral/primary/info/success/warning/
// danger). Kept here rather than in a separate Badge.jsx to avoid a case-only
// filename collision that breaks esbuild/Vite resolution. Bleu = statuts
// « en cours / ouverte », rôles — l'orange reste aux CTA.
const compatBadgeVariants = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  info: "bg-blue-100 text-blue-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-destructive/10 text-destructive",
};

export default function BadgeCompat({ children, variant = "neutral", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        compatBadgeVariants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
