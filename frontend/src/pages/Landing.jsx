import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  MessagesSquare,
  Search,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ListingCard from "@/components/listings/ListingCard";
import ListingCardSkeleton from "@/components/listings/ListingCardSkeleton";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import HeroFlow from "@/components/landing/HeroFlow";
import { useListings } from "@/hooks/useListings";
import { SPECIALTY_OPTIONS, labelFor } from "@/lib/choices";

// "Parcourir par spécialité" — modern cards (no photos), one per domain.
const SPECIALTY_TILES = [
  "cardiologie",
  "oncologie",
  "neurologie",
  "pediatrie",
  "psychiatrie",
  "radiologie",
  "dermatologie",
  "pneumologie",
  "gastroenterologie",
  "endocrinologie",
  "rhumatologie",
  "gynecologie",
];

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
  { icon: ShieldCheck, title: "Paiement sécurisé", text: "Fonds sous séquestre via Stripe." },
  { icon: BadgeCheck, title: "Rédacteurs vérifiés", text: "Qualifications contrôlées, badge dédié." },
  { icon: MessagesSquare, title: "Messagerie intégrée", text: "Du devis à la livraison, au même endroit." },
  { icon: FileText, title: "Spécialisé médical", text: "36 spécialités, 5 types de livrables." },
];

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

// Real listings on the home page (hidden if the API is down or returns nothing).
function PopularListings() {
  const { data, isLoading, isError } = useListings({ ordering: "-writer_rating" });
  // Une seule annonce par rédacteur (évite deux cartes avec la même photo).
  const seenWriters = new Set();
  const listings = (data?.results ?? [])
    .filter((listing) => {
      if (seenWriters.has(listing.writer)) return false;
      seenWriters.add(listing.writer);
      return true;
    })
    .slice(0, 5);

  if (isError || (!isLoading && listings.length === 0)) return null;

  return (
    <section className="container py-10 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-2xl sm:text-3xl">Annonces populaires</h2>
        <Link
          to="/listings"
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Voir tout <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => <ListingCardSkeleton key={i} />)
          : listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
      </div>
    </section>
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

      {/* Catégories — cartes spécialités modernes (sans photo). */}
      <section className="container py-10 sm:py-14">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl">Parcourir par spécialité</h2>
          <Link
            to="/listings"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Toutes les spécialités <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {SPECIALTY_TILES.map((s) => (
            <Link
              key={s}
              to={`/listings?specialty=${s}`}
              className="group flex items-center justify-between gap-2 rounded-lg border bg-card px-4 py-3.5 transition-colors hover:border-foreground"
            >
              <span className="truncate text-sm font-medium">
                {labelFor(s, SPECIALTY_OPTIONS)}
              </span>
              <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          ))}
        </div>
      </section>

      {/* Comment ça marche + réassurance — bande grise compacte. */}
      <section className="border-y bg-secondary/60">
        <div className="container py-10 sm:py-14">
          <h2 className="text-2xl sm:text-3xl">Comment ça marche</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-semibold text-background">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-6 border-t pt-8 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-3">
                <f.icon className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-semibold">{f.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final — bande bleu nuit, l'orange ne sert qu'au bouton. */}
      <section className="bg-foreground">
        <div className="container flex flex-col items-start gap-6 py-12 text-background sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div>
            <h2 className="text-2xl sm:text-3xl">Prêt à commencer ?</h2>
            <p className="mt-2 max-w-xl text-background/70">
              Créez votre compte médecin ou rédacteur en quelques minutes.
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
