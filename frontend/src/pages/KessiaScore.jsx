import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  FlaskConical,
  Gauge,
  ListChecks,
  Lock,
  Microscope,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// « Kessia Score » — page mi-vitrine d'un outil IA (en cours de développement par
// la stagiaire) qui estime la probabilité d'acceptation d'un article scientifique.
// L'interface d'analyse est présente mais désactivée : quand l'outil sera prêt,
// il suffira de brancher l'upload + l'appel API dans la carte du héros.

const STEPS = [
  {
    icon: UploadCloud,
    title: "Déposez votre article",
    text: "Importez votre manuscrit au format PDF ou DOCX en quelques secondes.",
  },
  {
    icon: Sparkles,
    title: "L'IA l'analyse",
    text: "Notre modèle évalue méthodologie, structure, originalité et clarté.",
  },
  {
    icon: Gauge,
    title: "Recevez votre score",
    text: "Obtenez une probabilité d'acceptation et des recommandations concrètes.",
  },
];

const CRITERIA = [
  {
    icon: Microscope,
    title: "Méthodologie & statistiques",
    text: "Robustesse du protocole, taille d'échantillon, tests statistiques adaptés.",
  },
  {
    icon: ListChecks,
    title: "Structure IMRaD",
    text: "Introduction, Méthodes, Résultats, Discussion : complétude et équilibre.",
  },
  {
    icon: FlaskConical,
    title: "Originalité & apport",
    text: "Nouveauté de la contribution au regard de la littérature existante.",
  },
  {
    icon: FileText,
    title: "Clarté & style",
    text: "Lisibilité, concision et qualité de la rédaction scientifique.",
  },
  {
    icon: BookOpen,
    title: "Qualité des références",
    text: "Pertinence, actualité et cohérence des sources citées.",
  },
  {
    icon: Target,
    title: "Adéquation à la revue",
    text: "Correspondance entre votre article et la ligne éditoriale visée.",
  },
];

// Données d'exemple pour l'aperçu du rapport (clairement étiqueté « Exemple »).
const SAMPLE_SCORE = 78;
const SAMPLE_BREAKDOWN = [
  { label: "Méthodologie", value: 82 },
  { label: "Structure IMRaD", value: 90 },
  { label: "Originalité", value: 71 },
  { label: "Clarté rédactionnelle", value: 76 },
  { label: "Références", value: 68 },
];
const SAMPLE_TIPS = [
  "Renforcer la section Méthodes : détailler le calcul de l'effectif.",
  "Clarifier l'objectif principal dès l'introduction.",
  "Actualiser 4 références datant de plus de dix ans.",
];

const FAQ = [
  {
    q: "Quand le Kessia Score sera-t-il disponible ?",
    a: "L'outil est en cours de développement par notre équipe. Cette page en présente un aperçu : laissez votre e-mail pour être prévenu dès l'ouverture.",
  },
  {
    q: "Comment fonctionne l'analyse ?",
    a: "Vous déposez votre article (PDF ou DOCX). Une IA en analyse la structure, la méthodologie, l'originalité et la clarté, puis estime une probabilité d'acceptation accompagnée de recommandations concrètes.",
  },
  {
    q: "Mes documents sont-ils confidentiels ?",
    a: "Oui. Vos fichiers ne servent qu'à produire votre analyse : ils ne sont ni partagés, ni publiés, ni réutilisés à d'autres fins.",
  },
  {
    q: "Le score garantit-il une publication ?",
    a: "Non. Il s'agit d'une estimation indicative destinée à améliorer votre article avant soumission, pas d'une garantie d'acceptation par une revue.",
  },
  {
    q: "Quelles spécialités sont prises en charge ?",
    a: "Le Kessia Score est pensé pour la recherche médicale et couvrira les principales spécialités déjà présentes sur Kessia.",
  },
  {
    q: "Puis-je aussi faire relire mon article par un humain ?",
    a: "Bien sûr. En attendant le lancement, nos rédacteurs vérifiés peuvent relire et améliorer votre article depuis les annonces.",
  },
];

// Jauge circulaire (SVG) — anneau de progression pour le score global.
function ScoreGauge({ value }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative grid place-items-center">
      <svg viewBox="0 0 128 128" className="size-36 -rotate-90" aria-hidden="true">
        <circle cx="64" cy="64" r={r} fill="none" strokeWidth="12" className="stroke-secondary" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-emerald-500"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold tracking-tight">{value}%</span>
        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          estimé
        </span>
      </div>
    </div>
  );
}

function CriteriaBar({ label, value }) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{value}/100</span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// Petite étiquette « Bêta / Exemple / Bientôt » réutilisable (orange discret).
function Tag({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      {Icon && <Icon className="size-3.5" />}
      {children}
    </span>
  );
}

export default function KessiaScore() {
  const [email, setEmail] = useState("");

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });

  const handleWaitlist = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    // Placeholder front-only : pas d'endpoint backend pour l'instant (v1 figée).
    // À brancher sur une vraie liste d'attente quand l'outil sera prêt.
    toast.success("Merci ! Nous vous préviendrons dès l'ouverture du Kessia Score.");
    setEmail("");
  };

  return (
    <div>
      {/* Héro — texte à gauche, carte « analyser » (désactivée) à droite. */}
      <section className="relative overflow-hidden border-b">
        <div
          aria-hidden
          className="absolute inset-y-10 right-0 hidden w-[42%] rounded-l-[4rem] bg-secondary/50 lg:block"
        />
        <div className="container relative pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pb-20 lg:pt-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <Tag icon={Sparkles}>Bêta · Bientôt disponible</Tag>
              <h1 className="mt-5 text-balance text-3xl sm:text-4xl lg:text-5xl">
                Estimez vos chances de publication avant de soumettre
              </h1>
              <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
                Le <span className="font-semibold text-foreground">Kessia Score</span> analyse votre
                article scientifique et estime sa probabilité d'acceptation, avec des
                recommandations concrètes pour la maximiser.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" onClick={() => scrollTo("waitlist")}>
                  <Bell className="size-4" /> Être prévenu du lancement
                </Button>
                <Button size="lg" variant="outline" onClick={() => scrollTo("fonctionnement")}>
                  Voir comment ça marche
                </Button>
              </div>

              <p className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="size-4" /> Analyse par IA
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4" /> Documents confidentiels
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Microscope className="size-4" /> Spécialisé recherche médicale
                </span>
              </p>
            </div>

            {/* Carte « analyser mon article » — l'emplacement du futur outil, désactivé. */}
            <div className="relative">
              <div className="mx-auto w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">Analyser mon article</p>
                  <Tag icon={Clock}>Bientôt</Tag>
                </div>

                {/* TODO (équipe) : brancher ici l'upload réel + l'appel à l'outil IA
                    de la stagiaire quand il sera disponible. */}
                <div className="mt-4 grid place-items-center rounded-xl border-2 border-dashed bg-secondary/40 px-6 py-10 text-center">
                  <UploadCloud className="size-9 text-muted-foreground" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium">Déposez votre article</p>
                  <p className="mt-1 text-xs text-muted-foreground">PDF ou DOCX · jusqu'à 25 Mo</p>
                </div>

                <Button size="lg" className="mt-4 w-full" disabled>
                  <Lock className="size-4" /> Analyse bientôt disponible
                </Button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5" /> Vos fichiers restent confidentiels
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche — 3 étapes. */}
      <section id="fonctionnement" className="container scroll-mt-24 py-12 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl">Comment ça marche</h2>
          <p className="mt-2 text-muted-foreground">
            Trois étapes, de votre manuscrit à un diagnostic clair.
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                  {i + 1}
                </span>
                <s.icon className="size-5 text-muted-foreground" aria-hidden="true" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Aperçu du rapport — la pièce maîtresse « vitrine » (données d'exemple). */}
      <section className="border-y bg-secondary/60">
        <div className="container py-12 sm:py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl">Votre rapport en un coup d'œil</h2>
              <p className="mt-2 text-muted-foreground">
                Un score global, le détail par critère et des pistes d'amélioration priorisées.
              </p>
            </div>
            <Tag>Exemple</Tag>
          </div>

          <div className="mt-8 grid gap-6 rounded-2xl border bg-card p-6 shadow-sm lg:grid-cols-[0.9fr_1.1fr] sm:p-8">
            {/* Score + verdict + recommandations */}
            <div className="flex flex-col items-center gap-5 border-b pb-6 text-center lg:items-start lg:border-b-0 lg:border-r lg:pb-0 lg:pr-8 lg:text-left">
              <ScoreGauge value={SAMPLE_SCORE} />
              <div>
                <p className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="size-4" /> Bonnes chances de publication
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Votre article est solide ; quelques ajustements ciblés peuvent encore améliorer
                  vos chances.
                </p>
              </div>
              <ul className="w-full space-y-2 text-left">
                {SAMPLE_TIPS.map((tip) => (
                  <li key={tip} className="flex gap-2 text-sm">
                    <ArrowRight className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Détail par critère */}
            <div>
              <p className="text-sm font-semibold">Détail par critère</p>
              <div className="mt-4 space-y-4">
                {SAMPLE_BREAKDOWN.map((c) => (
                  <CriteriaBar key={c.label} label={c.label} value={c.value} />
                ))}
              </div>
              <p className="mt-6 border-t pt-4 text-xs text-muted-foreground">
                Estimation indicative générée par IA — ne remplace pas l'évaluation par les pairs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Ce que l'analyse évalue — grille de critères. */}
      <section className="container py-12 sm:py-16">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl">Ce que le Kessia Score évalue</h2>
          <p className="mt-2 text-muted-foreground">
            Les mêmes critères qu'un comité de lecture passe en revue avant d'accepter un article.
          </p>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CRITERIA.map((c) => (
            <div key={c.title} className="rounded-xl border bg-card p-5">
              <c.icon className="size-5 text-primary" aria-hidden="true" />
              <h3 className="mt-3 font-semibold">{c.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Liste d'attente — capture d'e-mail (placeholder front pour l'instant). */}
      <section id="waitlist" className="border-t bg-secondary/60 scroll-mt-24">
        <div className="container py-12 sm:py-16">
          <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center shadow-sm">
            <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="size-6" />
            </span>
            <h2 className="mt-4 text-2xl">Soyez les premiers informés</h2>
            <p className="mt-2 text-muted-foreground">
              Le Kessia Score arrive bientôt. Laissez votre e-mail et nous vous préviendrons dès son
              ouverture.
            </p>
            <form
              onSubmit={handleWaitlist}
              className="mx-auto mt-6 flex w-full max-w-md flex-col gap-2 sm:flex-row"
            >
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                aria-label="Votre adresse e-mail"
                className="h-11"
              />
              <Button type="submit" size="lg" className="h-11 shrink-0">
                Me prévenir
              </Button>
            </form>
            <p className="mt-3 text-xs text-muted-foreground">
              Pas de spam — un seul e-mail, le jour du lancement.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="container max-w-3xl py-12 sm:py-16">
        <h2 className="text-2xl sm:text-3xl">Questions fréquentes</h2>
        <Accordion type="single" collapsible className="mt-6">
          {FAQ.map((item) => (
            <AccordionItem key={item.q} value={item.q}>
              <AccordionTrigger className="text-base">{item.q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* CTA final — ramène vers la marketplace (relecture humaine en attendant). */}
      <section className="bg-foreground">
        <div className="container flex flex-col items-start gap-6 py-12 text-background sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div>
            <h2 className="text-2xl sm:text-3xl">En attendant, faites relire votre article</h2>
            <p className="mt-2 max-w-xl text-background/70">
              Nos rédacteurs médicaux vérifiés peuvent relire et améliorer votre manuscrit dès
              maintenant.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/listings">Parcourir les rédacteurs</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link to="/requests">Publier une demande</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
