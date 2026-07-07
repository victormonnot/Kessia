import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";

// Teaser « Kessia Score » — bande bleu nuit qui annonce l'outil IA à venir
// (page /kessia-score). Honnête : l'outil n'est PAS encore disponible, d'où la
// pastille « Bientôt disponible » et l'aperçu de rapport étiqueté « Exemple ».
export default function KessiaScoreTeaser() {
  return (
    <section className="container py-10 sm:py-14">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-foreground px-6 py-10 text-background sm:px-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
          {/* Ligne « flow » discrète qui traverse la carte (déco uniquement). */}
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="score-flow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#F2620F" />
                <stop offset="1" stopColor="#F7943F" />
              </linearGradient>
            </defs>
            <path
              d="M -2 80 C 25 60, 55 95, 102 30"
              stroke="url(#score-flow)"
              strokeWidth="26"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity="0.15"
            />
          </svg>

          {/* Colonne gauche : annonce + CTA vers la page d'aperçu. */}
          <div className="relative">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-background/10 px-3 py-1 text-xs font-semibold">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
              Bientôt disponible
            </span>
            <h2 className="mt-4 text-2xl sm:text-3xl">Kessia Score</h2>
            <p className="mt-3 text-lg font-medium">
              Estimez les chances d'acceptation de votre article — avant de le soumettre.
            </p>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-background/70 sm:text-base">
              Méthodologie, structure IMRaD, clarté, références : une analyse développée par
              notre équipe, avec des recommandations concrètes pour renforcer votre manuscrit.
            </p>
            <div className="mt-6">
              <Button asChild size="lg">
                <Link to="/kessia-score">
                  Découvrir l'aperçu <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Colonne droite : mini-rapport. Chiffres = exemple illustratif, la
              carte est étiquetée « Exemple » (convention de la page /kessia-score). */}
          <div className="relative mt-8 lg:mt-0">
            <div className="relative rounded-2xl border border-background/15 bg-background/5 p-5">
              <span className="absolute right-4 top-4 text-xs font-semibold uppercase tracking-wide text-background/50">
                Exemple
              </span>
              <div className="flex items-center gap-6">
                {/* Jauge circulaire — score global (78 % de 2πr ≈ 251.3 → 196). */}
                <div className="relative size-24 shrink-0">
                  <svg viewBox="0 0 96 96" className="size-24" aria-hidden="true">
                    <defs>
                      <linearGradient id="score-arc" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#F2620F" />
                        <stop offset="1" stopColor="#F7943F" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-background/15"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="url(#score-arc)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray="196 251.3"
                      transform="rotate(-90 48 48)"
                    />
                  </svg>
                  <span className="absolute inset-0 grid place-items-center text-xl font-semibold tabular-nums">
                    78 %
                  </span>
                </div>

                {/* Détail par critère — deux barres suffisent pour le teaser. */}
                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-background/70">
                      <span>Méthodologie</span>
                      <span className="tabular-nums">82</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-background/15">
                      <div className="h-full w-[82%] rounded-full bg-primary/70" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs text-background/70">
                      <span>Structure IMRaD</span>
                      <span className="tabular-nums">90</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-background/15">
                      <div className="h-full w-[90%] rounded-full bg-primary/70" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
