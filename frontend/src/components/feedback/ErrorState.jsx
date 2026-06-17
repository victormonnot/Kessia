import { AlertTriangle } from "lucide-react";

import Button from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ErrorState({
  title = "Impossible de charger les données",
  description = "Une erreur est survenue. Vérifiez votre connexion et réessayez.",
  onRetry,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-6 py-14 text-center",
        className,
      )}
      role="alert"
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button variant="outline" className="mt-6" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </div>
  );
}
