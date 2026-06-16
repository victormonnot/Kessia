import { ExternalLink, FileText, Star } from "lucide-react";

export default function PublicationList({ items }) {
  return (
    <ul className="space-y-3">
      {items.map((p) => {
        const meta = [p.venue, p.year].filter(Boolean).join(" · ");
        return (
          <li key={p.id} className="flex items-start gap-2.5">
            {p.is_featured ? (
              <Star className="mt-0.5 size-4 shrink-0 text-accent-500" aria-label="Sélection" />
            ) : (
              <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            )}
            <div className="min-w-0">
              {p.url ? (
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium hover:text-primary hover:underline"
                >
                  {p.title}
                  <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                </a>
              ) : (
                <span className="font-medium">{p.title}</span>
              )}
              {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
