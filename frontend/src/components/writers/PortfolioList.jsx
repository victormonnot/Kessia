import { ExternalLink } from "lucide-react";

// A writer's réalisations / portfolio ("book"): a 2-column grid of work samples.
export default function PortfolioList({ items }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((p) => (
        <li key={p.id} className="rounded-lg border bg-card p-4">
          {p.kind && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {p.kind}
            </p>
          )}
          {p.url ? (
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 inline-flex items-center gap-1 font-medium hover:text-primary hover:underline"
            >
              {p.title}
              <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
            </a>
          ) : (
            <p className="mt-0.5 font-medium">{p.title}</p>
          )}
          {p.summary && (
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.summary}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
