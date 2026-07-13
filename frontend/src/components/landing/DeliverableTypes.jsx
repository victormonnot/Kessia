import { Link } from "react-router-dom";
import { ArrowRight, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";

// « Ce que vous pouvez commander » — les 4 livrables types en cartes illustrées
// d'un mini-document construit en barres (écho direct de la DeliveredCard du
// héro), + une bannière sur-mesure pour la place de marché inversée (/requests).
// On entre ici dans le catalogue par type de prestation (?deliverable_type=…),
// contrairement aux tuiles « spécialité » qui filtrent par domaine.

// Mini-documents : une silhouette différenciée par livrable — deux feuilles
// empilées (volume du protocole), bloc média (vulgarisation), feuille étroite
// (synopsis), paragraphe dense (résumé). Barres = bg-foreground/15, titres /25.
function ProtocoleMock() {
  return (
    <div className="relative">
      {/* Feuille arrière décalée : suggère l'épaisseur du document. */}
      <div className="absolute -left-1.5 -top-1.5 h-16 w-12 rounded-sm border bg-card shadow-sm" />
      <div className="relative h-16 w-12 rounded-sm border bg-card p-2 shadow-sm">
        <div className="h-1.5 w-3/4 rounded-full bg-foreground/25" />
        <div className="mt-1.5 h-1 w-full rounded-full bg-foreground/15" />
        <div className="mt-1 h-1 w-full rounded-full bg-foreground/15" />
        <div className="mt-1 h-1 w-2/3 rounded-full bg-foreground/15" />
        <div className="mt-1 h-1 w-full rounded-full bg-foreground/15" />
      </div>
    </div>
  );
}

function VulgarisationMock() {
  return (
    <div className="h-16 w-12 rounded-sm border bg-card p-2 shadow-sm">
      {/* Bloc « média » : le visuel qui rend le contenu accessible. */}
      <div className="h-3.5 w-full rounded-sm bg-primary/15" />
      <div className="mt-1.5 h-1 w-full rounded-full bg-foreground/15" />
      <div className="mt-1.5 h-1 w-2/3 rounded-full bg-foreground/15" />
    </div>
  );
}

function SynopsisMock() {
  return (
    <div className="h-16 w-10 rounded-sm border bg-card p-2 shadow-sm">
      <div className="h-1.5 w-2/3 rounded-full bg-foreground/25" />
      <div className="mt-1.5 h-1 w-full rounded-full bg-foreground/15" />
      <div className="mt-1 h-1 w-3/4 rounded-full bg-foreground/15" />
      <div className="mt-1 h-1 w-1/2 rounded-full bg-foreground/15" />
    </div>
  );
}

function ResumeMock() {
  return (
    <div className="h-16 w-12 rounded-sm border bg-card p-2 shadow-sm">
      <div className="h-1.5 w-3/4 rounded-full bg-foreground/25" />
      {/* Paragraphe serré : la densité d'un abstract. */}
      <div className="mt-1.5 h-1 w-full rounded-full bg-foreground/15" />
      <div className="mt-1 h-1 w-full rounded-full bg-foreground/15" />
      <div className="mt-1 h-1 w-full rounded-full bg-foreground/15" />
      <div className="mt-1 h-1 w-full rounded-full bg-foreground/15" />
    </div>
  );
}

// Les libellés reflètent DELIVERABLE_OPTIONS (choices.js).
const DELIVERABLES = [
  {
    value: "protocole_recherche",
    mock: ProtocoleMock,
    title: "Protocole de recherche",
    text: "Objectifs, méthodologie et plan d'étude structurés selon les standards.",
    meta: "Le socle de votre étude",
  },
  {
    value: "vulgarisation",
    mock: VulgarisationMock,
    title: "Vulgarisation scientifique",
    text: "Rendez vos travaux accessibles au grand public, sans perdre en rigueur.",
    meta: "Grand public, rigueur intacte",
  },
  {
    value: "synopsis_recherche",
    mock: SynopsisMock,
    title: "Synopsis de recherche",
    text: "Une synthèse claire et concise de votre projet d'étude.",
    meta: "L'essentiel, en quelques pages",
  },
  {
    value: "resume_recherche",
    mock: ResumeMock,
    title: "Résumé de recherche",
    text: "Un abstract prêt à soumettre pour vos congrès et publications.",
    meta: "Prêt pour vos congrès",
  },
];

export default function DeliverableTypes() {
  return (
    <section className="container py-10 sm:py-14">
      <Reveal>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl">Ce que vous pouvez commander</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
              Quatre livrables types, calibrés pour la publication scientifique — et le
              sur-mesure pour tout le reste.
            </p>
          </div>
          <Link
            to="/listings"
            className="hidden shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex"
          >
            Voir les annonces <ArrowRight className="size-4" />
          </Link>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {DELIVERABLES.map((d, i) => (
          <Reveal key={d.value} delay={i * 0.06} className="h-full">
            <Link
              to={`/listings?deliverable_type=${d.value}`}
              className="group flex h-full flex-col rounded-xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
            >
              <div
                className="mb-4 flex h-24 items-center justify-center rounded-lg bg-secondary/40"
                aria-hidden="true"
              >
                <d.mock />
              </div>
              <h3 className="font-semibold leading-snug transition-colors group-hover:text-primary">
                {d.title}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">{d.text}</p>
              <p className="mt-auto pt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="size-3.5" aria-hidden="true" />
                {d.meta}
              </p>
            </Link>
          </Reveal>
        ))}
      </div>

      {/* Bannière sur-mesure : la place de marché inversée (le médecin publie,
          les rédacteurs proposent). /requests/new est derrière l'auth → la
          redirection standard vers la connexion s'applique, c'est voulu. */}
      <Reveal delay={0.25}>
        <div className="mt-4 flex flex-col gap-4 rounded-xl border border-dashed bg-secondary/40 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Un besoin qui sort du cadre ?</h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Publiez une demande sur mesure : décrivez votre projet, les rédacteurs de
              votre spécialité vous envoient leurs propositions.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <Button asChild variant="outline">
              <Link to="/requests/new">Publier une demande</Link>
            </Button>
            <Link
              to="/requests"
              className="text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Voir les demandes en cours
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
