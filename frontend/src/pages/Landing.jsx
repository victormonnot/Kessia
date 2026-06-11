import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, FileText, MessagesSquare, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

const STEPS = [
  {
    title: "Trouvez ou publiez",
    text: "Parcourez les annonces de rédacteurs ou publiez une demande sur mesure.",
  },
  {
    title: "Payez en sécurité",
    text: "Le paiement est placé sous séquestre et n'est versé qu'à la livraison validée.",
  },
  {
    title: "Recevez votre livrable",
    text: "Échangez via la messagerie, téléchargez le travail et laissez un avis.",
  },
];

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Paiement sécurisé",
    text: "Fonds sous séquestre via Stripe, versés au rédacteur à la finalisation.",
  },
  {
    icon: BadgeCheck,
    title: "Rédacteurs vérifiés",
    text: "Un badge « Vérifié » distingue les profils aux qualifications validées.",
  },
  {
    icon: MessagesSquare,
    title: "Messagerie intégrée",
    text: "Échangez en temps réel, du devis à la livraison, sans quitter la plateforme.",
  },
  {
    icon: FileText,
    title: "Spécialisé médical",
    text: "36 spécialités et 5 types de livrables, pensés pour la rédaction scientifique.",
  },
];

// Vignettes du « cabinet de planches » — gravures domaine public (cf.
// public/img/README.md). La dernière renvoie vers tout le catalogue.
const PLATES = [
  ...["cardiologie", "neurologie", "pneumologie", "ophtalmologie", "rhumatologie"].map((s) => ({
    file: s,
    label: labelFor(s, SPECIALTY_OPTIONS),
    to: `/listings?specialty=${s}`,
  })),
  { file: "botanique", label: "+ 31 autres", to: "/listings" },
];

export default function Landing() {
  return (
    <div>
      {/* Héro — planche gravée sur papier, deux colonnes. */}
      <section className="border-b">
        <div className="container grid items-center gap-10 py-14 sm:py-20 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16">
          <div>
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Marketplace de rédaction médicale & scientifique
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <h1 className="mt-5 max-w-xl text-balance text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
                La rédaction médicale, <em className="text-accent-600">signée par des experts</em>.
              </h1>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground">
                Kessia met en relation médecins et institutions avec des rédacteurs scientifiques
                qualifiés — articles de recherche, études de cas, résumés, et plus.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link to="/listings">
                    Trouver un rédacteur <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/register">Proposer mes services</Link>
                </Button>
              </div>
            </Reveal>
            <Reveal delay={0.2}>
              <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-primary" /> Paiement sous séquestre
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="size-4 text-primary" /> Rédacteurs vérifiés
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-4 text-primary" /> 36 spécialités
                </span>
              </p>
            </Reveal>
          </div>

          <Reveal delay={0.1} className="mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-none">
            <figure>
              <img
                src="/img/engravings/hero-coeur.jpg"
                alt="Planche anatomique du cœur humain gravée par T. Milton en 1814"
                width="1192"
                height="1600"
                // eslint-disable-next-line react/no-unknown-property -- attribut DOM minuscule, React 18 (camelCase = React 19)
                fetchpriority="high"
                className="img-engraving max-h-[420px] w-full object-contain lg:max-h-[520px]"
              />
              <figcaption className="mt-3 text-center text-xs italic text-muted-foreground">
                Pl. II — Anatomie du cœur humain. T. Milton, 1814. Wellcome Collection.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      {/* Comment ça marche — colonnes numérotées façon sommaire. */}
      <section className="border-b bg-card">
        <div className="container py-14 sm:py-20">
          <Reveal>
            <h2 className="text-balance text-3xl font-semibold sm:text-4xl">Comment ça marche</h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Trois étapes, du premier contact à la livraison validée.
            </p>
          </Reveal>
          <div className="mt-10 grid gap-8 md:grid-cols-3 md:gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.1}>
                <div className="border-t-2 border-foreground/15 pt-5">
                  <span className="font-display text-4xl font-semibold text-accent-600">
                    0{i + 1}
                  </span>
                  <h3 className="mt-3 text-xl font-semibold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cabinet de planches — une gravure par grande famille de spécialités. */}
      <section className="container py-14 sm:py-20">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
                Toutes les spécialités
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                De la cardiologie à la virologie, chaque domaine a ses plumes.
              </p>
            </div>
            <Link
              to="/listings"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Parcourir les annonces <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-10 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-6">
          {PLATES.map((p, i) => (
            <Reveal key={p.label} delay={i * 0.05}>
              <Link to={p.to} className="group block text-center">
                <div className="flex h-28 items-center justify-center overflow-hidden sm:h-36">
                  <img
                    src={`/img/engravings/${p.file}.jpg`}
                    alt=""
                    loading="lazy"
                    className="img-engraving max-h-full w-auto transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="mt-3 text-sm font-medium text-foreground transition-colors group-hover:text-primary">
                  {p.label}
                </p>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Audiences — panneau papier vs panneau sapin. */}
      <section className="border-y bg-card">
        <div className="container grid gap-6 py-14 sm:py-20 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col border border-foreground bg-background p-8 sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Pour les médecins
              </p>
              <h3 className="mt-3 text-2xl font-semibold">Vous êtes médecin</h3>
              <p className="mt-3 flex-1 text-muted-foreground">
                Parcourez les annonces, commandez un livrable ou publiez une demande sur mesure.
                Suivez l'avancement et payez en toute sécurité.
              </p>
              <Button asChild className="mt-8 self-start">
                <Link to="/listings">
                  Parcourir les annonces <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col bg-primary p-8 text-primary-foreground sm:p-10">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">
                Pour les rédacteurs
              </p>
              <h3 className="mt-3 text-2xl font-semibold">Vous êtes rédacteur</h3>
              <p className="mt-3 flex-1 text-primary-foreground/80">
                Publiez vos services, recevez des commandes et répondez aux demandes ouvertes.
                Faites-vous vérifier et développez votre activité.
              </p>
              <Button
                asChild
                className="mt-8 self-start bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link to="/register">
                  Devenir rédacteur <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* La rigueur en standard — liste éditoriale à filets. */}
      <section className="container py-14 sm:py-20">
        <Reveal>
          <h2 className="text-balance text-3xl font-semibold sm:text-4xl">
            La rigueur en standard
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="border-t-2 border-foreground/15 pt-5">
                <f.icon className="size-5 text-primary" aria-hidden="true" />
                <h3 className="mt-3 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA final — bande sapin pleine largeur. */}
      <section className="bg-primary">
        <div className="container py-16 text-center text-primary-foreground sm:py-20">
          <Reveal>
            <h2 className="text-balance text-3xl font-semibold sm:text-4xl">Prêt à commencer ?</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
              Rejoignez Kessia et donnez vie à vos projets de rédaction médicale.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <Link to="/register">Créer un compte</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/listings">Parcourir les annonces</Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
