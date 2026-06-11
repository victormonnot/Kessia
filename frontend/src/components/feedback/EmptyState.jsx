import { cn } from "@/lib/utils";

// Reusable empty-state block: engraving or icon bubble, title, description and
// an optional CTA. `image` takes precedence over `icon` (fond papier requis
// pour le rendu gravure, d'où le bg-background).
export default function EmptyState({ icon: Icon, image, title, description, action, className }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-background px-6 py-14 text-center",
        className,
      )}
    >
      {image ? (
        <img src={image} alt="" loading="lazy" className="img-engraving mb-5 max-h-40 w-auto" />
      ) : Icon ? (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      ) : null}
      {title && <h3 className="text-base font-semibold text-foreground">{title}</h3>}
      {description && (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
