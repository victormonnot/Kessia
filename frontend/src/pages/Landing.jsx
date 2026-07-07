import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BadgeCheck, FileText, Search, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import HeroFlow from "@/components/landing/HeroFlow";
import PopularListings from "@/components/landing/PopularListings";
import SpecialtyGrid from "@/components/landing/SpecialtyGrid";
import DeliverableTypes from "@/components/landing/DeliverableTypes";
import HowItWorks from "@/components/landing/HowItWorks";
import Engagements from "@/components/landing/Engagements";
import AudienceSplit from "@/components/landing/AudienceSplit";
import KessiaScoreTeaser from "@/components/landing/KessiaScoreTeaser";
import FaqSection from "@/components/landing/FaqSection";

// Floating card spotlighting the flagship feature: writers vetted by a committee.
// It lives INSIDE the hero's right grid column, so it scales with the layout and
// can never slip behind the left content. The photo pops out of the top-left
// corner (white ring behind it); the badge sits at its top-right — positioned
// RELATIVE TO THE PHOTO, so tweak its left-[..px] / top-[..px] freely.
function VerifiedWriterCard() {
  return (
    <div className="relative mx-auto w-full max-w-xs rounded-2xl border bg-card p-6 pt-14 shadow-xl">
      <div className="absolute -top-8 left-6">
        <Avatar className="size-20 ring-4 ring-card">
          <AvatarImage src="/img/avatars/05.jpg" alt="" />
          <AvatarFallback className="bg-secondary text-lg font-semibold text-foreground">
            CF
          </AvatarFallback>
        </Avatar>
        <VerifiedBadge
          solid
          label="Vérifié par le comité"
          className="absolute left-[56px] top-[-13px] whitespace-nowrap px-3.5 py-1.5 text-sm shadow-md"
        />
      </div>
      <p className="font-semibold leading-tight">Dr Claire Fontaine</p>
      <p className="text-sm text-muted-foreground">Cardiologie · Paris</p>
      <p className="mt-3 font-semibold leading-snug">
        Des rédacteurs vérifiés par notre comité
      </p>
    </div>
  );
}

// Second card on the orange "process line" (bottom-right): the outcome. Pairs
// with VerifiedWriterCard to tell the story order → delivered, ready to publish.
function DeliveredCard() {
  return (
    <div className="relative ml-auto mt-10 w-full max-w-[15.5rem] rounded-2xl border bg-card p-5 shadow-xl">
      {/* Mini aperçu du document livré (réponse visuelle à la photo de la carte
          vérifié). « Livré » en souligné remplace l'ancienne coche/pastille. */}
      <div className="relative mb-3 flex h-24 items-center justify-center rounded-xl bg-secondary/40">
        <div className="h-16 w-12 rounded-sm border bg-card p-2 shadow-sm">
          <div className="h-1.5 w-3/4 rounded-full bg-foreground/25" />
          <div className="mt-1.5 h-1 w-full rounded-full bg-foreground/15" />
          <div className="mt-1 h-1 w-full rounded-full bg-foreground/15" />
          <div className="mt-1 h-1 w-2/3 rounded-full bg-foreground/15" />
        </div>
        <span className="absolute right-3 top-3 text-xs font-bold text-emerald-600 underline decoration-2 underline-offset-2">
          Livré
        </span>
      </div>
      <p className="font-semibold leading-snug">Votre article, prêt à être publié</p>
      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <FileText className="size-4 shrink-0" /> article-recherche.docx
      </p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(query.trim() ? `/listings?search=${encodeURIComponent(query.trim())}` : "/listings");
  };

  return (
    <div>
      {/* Héro — grille 2 colonnes : texte/recherche à gauche, carte à droite.
          La grille rend tout responsive : la carte vit dans sa colonne, elle ne
          peut donc plus déborder ni passer derrière le texte sur petit écran. */}
      <section className="relative overflow-hidden border-b">
        {/* Fond gris qui file jusqu'au bord droit, derrière la grille (lg+). */}
        <div
          aria-hidden
          className="absolute inset-y-12 right-0 hidden w-[44%] rounded-l-[4rem] bg-secondary/50 lg:block"
        />
        {/* Déco « flow » (ligne orange = process) qui relie les deux cartes. */}
        <HeroFlow />
        <div className="container relative pt-8 pb-14 sm:pt-10 sm:pb-16 lg:pb-20 lg:pt-12">
          <div className="grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            {/* Colonne gauche : texte + recherche */}
            <div>
              <h1 className="text-balance text-3xl sm:text-4xl lg:text-5xl">
                Trouvez le bon rédacteur médical pour vos publications
              </h1>
              <p className="mt-12 max-w-xl text-base text-muted-foreground sm:text-lg">
                Articles de recherche, études de cas, résumés, rédigés par des rédacteurs
                scientifiques qualifiés et vérifiés.
              </p>

              {/* Barre un peu plus large que sa colonne : elle déborde vers la
                  droite (sur le fond gris) sans jamais atteindre la carte. */}
              <form
                onSubmit={submitSearch}
                className="mt-12 flex w-full max-w-xl gap-2 rounded-xl border bg-card p-2 shadow-lg focus-within:ring-2 focus-within:ring-ring/30 lg:max-w-none lg:w-[116%]"
              >
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Essayez « article de revue en cardiologie »…"
                    aria-label="Rechercher une annonce"
                    className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                  />
                </div>
                <Button type="submit" size="lg" className="h-11">
                  Rechercher
                </Button>
              </form>

              <p className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4" /> Paiement sous séquestre
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <BadgeCheck className="size-4" /> Rédacteurs vérifiés
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <FileText className="size-4" /> 36 spécialités
                </span>
              </p>
            </div>

            {/* Colonne droite : deux cartes le long de la ligne orange (process),
                au-dessus de la déco ; cachées en mobile. */}
            <div className="relative hidden lg:block">
              <VerifiedWriterCard />
              <DeliveredCard />
            </div>
          </div>
        </div>
      </section>

      {/* Vraies annonces dès l'accueil (masquée si l'API ne répond pas). */}
      <PopularListings />

      {/* Catégories — tuiles spécialités à monogramme (écho du favicon). */}
      <SpecialtyGrid />

      {/* Catalogue par type de prestation, en mini-documents illustrés. */}
      <DeliverableTypes />

      {/* Le parcours de commande le long de la ligne orange du héro. */}
      <HowItWorks />

      {/* Garanties vérifiables — remplace les témoignages de démo. */}
      <Engagements />

      {/* Deux faces du marché : médecins ↔ rédacteurs, chacun son CTA. */}
      <AudienceSplit />

      {/* Teaser honnête de l'outil à venir (page /kessia-score). */}
      <KessiaScoreTeaser />

      {/* Questions fréquentes — lève les objections avant la conversion. */}
      <FaqSection />

      {/* CTA final — bande bleu nuit, l'orange ne sert qu'au bouton. La ligne
          orange du héro « sort » de la page ici, très atténuée. */}
      <section className="relative overflow-hidden bg-foreground">
        <div aria-hidden className="pointer-events-none absolute inset-0 select-none">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="cta-flow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#F2620F" />
                <stop offset="1" stopColor="#F7943F" />
              </linearGradient>
            </defs>
            <path
              d="M -2 90 C 30 75, 60 85, 102 10"
              stroke="url(#cta-flow)"
              strokeWidth="26"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              opacity="0.12"
            />
          </svg>
          <svg
            className="absolute right-6 top-6 h-20 w-36 text-background/15"
            fill="currentColor"
          >
            <defs>
              <pattern id="cta-dots" width="22" height="22" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cta-dots)" />
          </svg>
        </div>
        <div className="container relative flex flex-col items-start gap-6 py-12 text-background sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div>
            <h2 className="text-2xl sm:text-3xl">Prêt à commencer ?</h2>
            <p className="mt-2 max-w-xl text-background/70">
              Un seul compte pour commander ou rédiger — prêt en quelques minutes.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/register">Créer un compte</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-background/30 bg-transparent text-background hover:bg-background/10 hover:text-background"
            >
              <Link to="/listings">Parcourir les annonces</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
