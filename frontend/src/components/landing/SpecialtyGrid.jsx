import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import Reveal from "@/components/motion/Reveal";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

// « Parcourir par spécialité » — tuiles monogramme sur bande grise. Le chip
// monogramme (carré bleu nuit au survol, lettres + point orange) fait écho au
// favicon (K + point orange) : c'est la signature visuelle de la section.
const TILES = [
  { value: "cardiologie", mono: "Ca" },
  { value: "oncologie", mono: "On" },
  { value: "neurologie", mono: "Ne" },
  { value: "pediatrie", mono: "Pé" },
  { value: "psychiatrie", mono: "Ps" },
  { value: "radiologie", mono: "Ra" },
  { value: "dermatologie", mono: "De" },
  { value: "pneumologie", mono: "Pn" },
  { value: "gastroenterologie", mono: "Ga" },
  { value: "endocrinologie", mono: "En" },
  { value: "gynecologie", mono: "Gy" },
];

export default function SpecialtyGrid() {
  return (
    <section className="relative overflow-hidden border-y bg-secondary/40">
      {/* Grille de points décorative, collée au coin de la section — assez
          haute et courte pour ne pas chevaucher le lien du header. */}
      <svg
        className="pointer-events-none absolute right-4 top-4 hidden h-14 w-48 text-neutral-300 sm:block"
        fill="currentColor"
        aria-hidden
      >
        <defs>
          <pattern id="spec-dots" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#spec-dots)" />
      </svg>

      <div className="container relative py-10 sm:py-14">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl">Parcourir par spécialité</h2>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                36 spécialités médicales couvertes — trouvez un rédacteur qui parle
                votre langue.
              </p>
            </div>
            {/* Masqué en mobile (libellé long) : la tuile « 36 » mène au même
                endroit. Même comportement que le lien de DeliverableTypes. */}
            <Link
              to="/listings"
              className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
            >
              Toutes les spécialités <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {TILES.map((tile) => (
              <Link
                key={tile.value}
                to={`/listings?specialty=${tile.value}`}
                className="group flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
              >
                {/* Chip monogramme : s'inverse au survol, le point reste orange. */}
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-semibold tracking-tight text-foreground transition-colors group-hover:bg-foreground group-hover:text-background"
                >
                  {/* Wrapper unique : garde lettres et point sur la même ligne. */}
                  <span>
                    {tile.mono}
                    <span className="text-primary">.</span>
                  </span>
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium transition-colors group-hover:text-primary">
                  {labelFor(tile.value, SPECIALTY_OPTIONS)}
                </span>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}

            {/* 12e tuile : renvoi vers le catalogue complet. */}
            <Link
              to="/listings"
              className="group flex items-center gap-3 rounded-xl border border-dashed bg-card px-4 py-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
            >
              <span
                aria-hidden="true"
                className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-sm font-semibold tracking-tight text-primary"
              >
                36
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium transition-colors group-hover:text-primary">
                Voir les 36 spécialités
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
