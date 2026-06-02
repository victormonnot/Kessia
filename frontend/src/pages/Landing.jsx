import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  MessagesSquare,
  Search,
  ShieldCheck,
  Stethoscope,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import Reveal from "@/components/motion/Reveal";

const STEPS = [
  {
    icon: Search,
    title: "Trouvez ou publiez",
    text: "Parcourez les annonces de rédacteurs ou publiez une demande sur mesure.",
  },
  {
    icon: ShieldCheck,
    title: "Payez en sécurité",
    text: "Le paiement est placé sous séquestre et n'est versé qu'à la livraison validée.",
  },
  {
    icon: Upload,
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
    text: "12 spécialités et 5 types de livrables, pensés pour la rédaction scientifique.",
  },
];

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        <div
          aria-hidden
          className="absolute -right-24 -top-24 size-80 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-24 -left-24 size-80 rounded-full bg-accent-500/10 blur-3xl"
        />
        <div className="container relative py-20 text-center sm:py-28">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium text-muted-foreground">
              <Stethoscope className="size-4 text-primary" /> Marketplace de rédaction médicale
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
              La rédaction médicale, <span className="text-primary">à la demande</span>.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Kessia met en relation médecins et institutions avec des rédacteurs scientifiques
              qualifiés — articles de revue, études de cas, résumés, et plus.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link to="/register">
                  Créer un compte <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/listings">Parcourir les annonces</Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="size-4 text-primary" /> Paiement sécurisé
              </span>
              <span className="inline-flex items-center gap-1">
                <BadgeCheck className="size-4 text-primary" /> Rédacteurs vérifiés
              </span>
              <span className="inline-flex items-center gap-1">
                <FileText className="size-4 text-primary" /> 12 spécialités
              </span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="container py-16 sm:py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Comment ça marche</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Trois étapes, du premier contact à la livraison validée.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1}>
              <div className="relative h-full rounded-xl border bg-card p-6 shadow-sm">
                <span className="absolute right-5 top-5 text-4xl font-bold text-muted/60">
                  {i + 1}
                </span>
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <s.icon className="size-6" />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section className="border-y bg-muted/30 py-16 sm:py-20">
        <div className="container grid gap-6 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-xl border bg-card p-8 shadow-sm">
              <h3 className="text-xl font-bold">Vous êtes médecin</h3>
              <p className="mt-2 flex-1 text-muted-foreground">
                Parcourez les annonces, commandez un livrable ou publiez une demande sur mesure.
                Suivez l'avancement et payez en toute sécurité.
              </p>
              <Button asChild className="mt-6 self-start">
                <Link to="/listings">
                  Parcourir les annonces <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex h-full flex-col rounded-xl border bg-card p-8 shadow-sm">
              <h3 className="text-xl font-bold">Vous êtes rédacteur</h3>
              <p className="mt-2 flex-1 text-muted-foreground">
                Publiez vos services, recevez des commandes et répondez aux demandes ouvertes.
                Faites-vous vérifier et développez votre activité.
              </p>
              <Button asChild className="mt-6 self-start">
                <Link to="/register">
                  Devenir rédacteur <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features */}
      <section className="container py-16 sm:py-20">
        <Reveal className="text-center">
          <h2 className="text-3xl font-bold tracking-tight">Pensé pour la rédaction médicale</h2>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="h-full rounded-xl border bg-card p-6 shadow-sm">
                <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container pb-20">
        <Reveal>
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent-700 px-8 py-14 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold tracking-tight">Prêt à commencer ?</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">
              Rejoignez Kessia et donnez vie à vos projets de rédaction médicale.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary">
                <Link to="/register">Créer un compte</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/listings">Parcourir les annonces</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
