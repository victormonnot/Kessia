import { Link } from "react-router-dom";
import { AlignLeft, ArrowRight, ClipboardList, ListChecks, Megaphone, Sparkles } from "lucide-react";

// « Ce que vous pouvez commander » — les 5 types de livrables, en cartes
// icône + description. Volontairement distinct des tuiles « spécialité » (qui
// filtrent par domaine) : ici on entre dans le catalogue par type de prestation
// (?deliverable_type=…). Les libellés reflètent DELIVERABLE_OPTIONS (choices.js).
const DELIVERABLES = [
  {
    value: "protocole_recherche",
    icon: ClipboardList,
    title: "Protocole de recherche",
    text: "Objectifs, méthodologie et plan d'étude structurés selon les standards.",
  },
  {
    value: "vulgarisation",
    icon: Megaphone,
    title: "Vulgarisation scientifique",
    text: "Rendez vos travaux accessibles au grand public, sans perdre en rigueur.",
  },
  {
    value: "synopsis_recherche",
    icon: ListChecks,
    title: "Synopsis de recherche",
    text: "Une synthèse claire et concise de votre projet d'étude.",
  },
  {
    value: "resume_recherche",
    icon: AlignLeft,
    title: "Résumé de recherche",
    text: "Un abstract prêt à soumettre pour vos congrès et publications.",
  },
  {
    value: "autres",
    icon: Sparkles,
    title: "Un autre besoin ?",
    text: "Décrivez votre projet : un rédacteur de votre spécialité s'en charge.",
  },
];

export default function DeliverableTypes() {
  return (
    <section className="container py-10 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl">Ce que vous pouvez commander</h2>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
            Cinq types de livrables, rédigés par des scientifiques de votre spécialité.
          </p>
        </div>
        <Link
          to="/listings"
          className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          Voir les annonces <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {DELIVERABLES.map((d) => (
          <Link
            key={d.value}
            to={`/listings?deliverable_type=${d.value}`}
            className="group flex items-start gap-4 rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary text-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
              <d.icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="font-semibold leading-snug transition-colors group-hover:text-primary">
                {d.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.text}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
